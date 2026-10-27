// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * Puts the known Sepolia policy Safes in a Space on a CGW and reads their
 * active policies.
 *
 *   node --env-file-if-exists=playground/protocol-kit/.env \
 *        playground/protocol-kit/policies/cgw-space-policies.ts [--staging] [--space-name NAME]
 *        [--new] [--types a,b] [--siwe-domain HOST]
 *
 * Settings come from the environment (see playground/protocol-kit/.example.env): PRIVATE_KEY,
 * CGW_URL / CGW_STAGING_URL, KNOWN_POLICY_SAFES and, optionally, POLICY_SHOWCASE_SAFE.
 *
 * 1. Signs in with SIWE (PRIVATE_KEY) and registers the user.
 * 2. Reuses the Space named --space-name, or creates it (--new: always create).
 * 3. Adds every Safe in KNOWN_POLICY_SAFES that is not in it yet, up to
 *    the Space's free Safe seats where the CGW enforces entitlements.
 * 4. Signs in again, so the printed token is fresh.
 * 5. Fetches the Space's active policies, prints a summary per Safe, and
 *    prints curl commands that carry the access token.
 *
 * The gateway is CGW_STAGING_URL with --staging, else CGW_URL. The SIWE
 * message is bound to the gateway's host;
 * --siwe-domain binds it to another host, for a CGW whose allow list
 * (`auth.allowedSiweDomains`) does not include its own.
 */

import { parseArgs } from 'node:util';
import type { Address } from 'viem';
import { signerAccount } from './common/accounts.ts';
import { ConfigError, envAddress } from './common/config.ts';
import { SEPOLIA_CHAIN_ID } from './common/deployments.ts';
import {
  createGatewayClient,
  defaultGatewayUrl,
  type GatewayClient,
  spaceHoldsSafe,
  stagingGatewayUrl,
} from './common/gateway.ts';
import { knownPolicySafes } from './common/known-safes.ts';
import { CGW_POLICY_TYPES } from './common/policies.ts';

// ─── Fixed inputs ───────────────────────────────────────────────────────────

const CHAIN_ID = String(SEPOLIA_CHAIN_ID);
const DEFAULT_SPACE_NAME = 'known policy safes';
const DEFAULT_POLICY_TYPES = CGW_POLICY_TYPES.join(',');

/** The Safes to put in the Space (KNOWN_POLICY_SAFES), resolved in {@link main}. */
let KNOWN_SAFES: Array<{ label: string; address: Address }>;

type ActivePolicy = {
  type: string;
  enforcement: {
    via: string;
    guards?: { transactionGuard?: unknown; moduleGuard?: unknown };
  };
  enabled: boolean;
  safe: { chainId: string; address: string };
};

// ─── Options ────────────────────────────────────────────────────────────────

function parseOptions(): {
  staging: boolean;
  siweDomain: string | undefined;
  spaceName: string;
  alwaysCreate: boolean;
  types: string;
} {
  const { values } = parseArgs({
    options: {
      staging: { type: 'boolean' },
      'siwe-domain': { type: 'string' },
      'space-name': { type: 'string' },
      new: { type: 'boolean' },
      types: { type: 'string' },
    },
  });
  return {
    staging: values.staging ?? false,
    siweDomain: values['siwe-domain'],
    spaceName: values['space-name'] ?? DEFAULT_SPACE_NAME,
    alwaysCreate: values.new ?? false,
    types: values.types ?? DEFAULT_POLICY_TYPES,
  };
}

const options = parseOptions();
/** Resolved in {@link main}, so a missing setting is reported rather than thrown at load. */
let gateway: GatewayClient;

// ─── CGW ────────────────────────────────────────────────────────────────────

/** Registers the user, then reuses the named Space or creates it. */
async function ensureSpace(
  token: string,
  name: string,
  alwaysCreate: boolean,
): Promise<string> {
  await gateway.registerUser(token);
  if (!alwaysCreate) {
    const existing = (await gateway.listSpaces(token)).find((space) => space.name === name);
    if (existing) {
      console.log(`  • reusing Space "${name}" (${existing.uuid})`);
      return existing.uuid;
    }
  }
  const uuid = await gateway.createSpace(token, name);
  console.log(`  ✓ created Space "${name}" (${uuid})`);
  return uuid;
}

/** Adds the known Safes the Space lacks, as many as it has free seats for. */
async function addKnownSafes(token: string, spaceId: string): Promise<void> {
  const held = await gateway.listSpaceSafes(token, spaceId);
  const missing = KNOWN_SAFES.filter(
    (safe) => !spaceHoldsSafe(held, { chainId: CHAIN_ID, address: safe.address }),
  );
  const freeSeats =
    missing.length === 0 ? null : await gateway.freeSafeSeats(token, spaceId);
  const toAdd = missing.slice(0, freeSeats ?? missing.length);
  for (const safe of KNOWN_SAFES) {
    const mark = !missing.includes(safe)
      ? '• already in'
      : toAdd.includes(safe)
        ? '✓ adding'
        : '✗ no seat for';
    console.log(`  ${mark} ${safe.address} ${safe.label}`);
  }
  if (toAdd.length < missing.length) {
    console.log(
      `\n  ! The Space has ${freeSeats} free Safe seat(s), ${missing.length} needed.` +
        '\n    Seats come from a subscription: buy one for this Space in the' +
        '\n    wallet (Stripe test card 4242 4242 4242 4242), then run again.',
    );
  }
  if (toAdd.length === 0) {
    return;
  }
  await gateway.addSafesToSpace(
    token,
    spaceId,
    toAdd.map((safe) => ({ chainId: CHAIN_ID, address: safe.address })),
  );
}

async function fetchActivePolicies(
  token: string,
  spaceId: string,
  types: string,
): Promise<Array<ActivePolicy>> {
  const path = `/v1/spaces/${spaceId}/policies/active?types=${types}`;
  return (await (await gateway.request(path, { token })).json()) as Array<ActivePolicy>;
}

/** `via`, plus the guard slots for a guard-enforced policy, e.g. `guard[tx+module]`. */
function enforcementLabel(policy: ActivePolicy): string {
  const { via, guards } = policy.enforcement;
  if (!guards) {
    return via;
  }
  const slots = [
    guards.transactionGuard ? 'tx' : null,
    guards.moduleGuard ? 'module' : null,
  ].filter(Boolean);
  return `${via}[${slots.join('+')}]`;
}

function printSummary(policies: Array<ActivePolicy>): void {
  for (const safe of KNOWN_SAFES) {
    const own = policies.filter(
      (policy) =>
        policy.safe.address.toLowerCase() === safe.address.toLowerCase(),
    );
    const counts = new Map<string, number>();
    for (const policy of own) {
      const key = `${policy.type}/${enforcementLabel(policy)}${policy.enabled ? '' : ' (disabled)'}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const detail = [...counts]
      .map(([key, count]) => `${key} x${count}`)
      .join(', ');
    console.log(`  ${safe.address} ${safe.label}: ${own.length} policies`);
    if (detail) {
      console.log(`    ${detail}`);
    }
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const signer = signerAccount();
  gateway = createGatewayClient(options.staging ? stagingGatewayUrl() : defaultGatewayUrl());
  KNOWN_SAFES = knownPolicySafes();
  if (KNOWN_SAFES.length === 0) {
    throw new ConfigError('KNOWN_POLICY_SAFES lists no Safes: see playground/protocol-kit/.example.env');
  }
  const signIn = async (): Promise<string> => {
    const token = await gateway.signIn(signer, { chainId: SEPOLIA_CHAIN_ID, siweDomain: options.siweDomain });
    console.log(`  ✓ signed in as ${signer.address}`);
    return token;
  };

  console.log(`1. Sign in to ${gateway.url}`);
  const setupToken = await signIn();

  console.log('\n2. Space');
  const spaceId = await ensureSpace(
    setupToken,
    options.spaceName,
    options.alwaysCreate,
  );

  console.log('\n3. Known Safes');
  await addKnownSafes(setupToken, spaceId);

  console.log('\n4. Sign in again');
  const token = await signIn();

  console.log('\n5. Active policies');
  const policies = await fetchActivePolicies(token, spaceId, options.types);
  printSummary(policies);

  const base = `${gateway.url}/v1/spaces/${spaceId}/policies`;
  const auth = `-H 'Cookie: access_token=${token}'`;
  console.log(`\nAll Safes in the Space:\n
  curl -s '${base}/active?types=${options.types}' \\
    ${auth} | jq`);
  const showcaseSafe = envAddress('POLICY_SHOWCASE_SAFE');
  if (showcaseSafe) {
    console.log(`\nThe showcase Safe only:\n
  curl -s '${base}/active?types=${options.types}&safes=${CHAIN_ID}:${showcaseSafe}' \\
    ${auth} | jq`);
  }
  console.log(`\nPending policy changes:\n
  curl -s '${base}/pending?types=spending-limit' \\
    ${auth} | jq`);
}

main().catch((error: unknown) => {
  console.error(error instanceof ConfigError ? `✗ ${error.message}` : error);
  process.exit(1);
});
