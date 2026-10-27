// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * Stores NATIVE_TRANSFER configuration requests for Safes of a new Space.
 *
 *   node --env-file-if-exists=playground/protocol-kit/.env \
 *        playground/protocol-kit/policies/cgw-policy-requests.ts
 *        [--space UUID] [--sepolia-safe 0x…] [--polygon-safe 0x…]
 *
 * Settings come from the environment (see playground/protocol-kit/.example.env): PRIVATE_KEY,
 * CGW_URL, and POLICY_SHOWCASE_SAFE as the default for both Safes.
 *
 * 1. Signs in with SIWE (PRIVATE_KEY) and registers the user.
 * 2. Creates a new Space (--space: reuses that one instead) and adds one Safe
 *    on Sepolia and one on Polygon, unless the Space already has them.
 * 3. For each Safe, stores two configuration requests:
 *    a. add Alice and Bob as allowed ETH (native) recipients;
 *    b. remove Bob (his binding with the zero-address policy).
 * 4. Prints the Space, the Safes and the roots, to check against the DB.
 *
 * CGW does not check the Safes on chain here, so the Polygon Safe only has to
 * be an address.
 */

import { parseArgs } from 'node:util';
import { type Address, getAddress, keccak256, slice, toHex, zeroAddress } from 'viem';
import { signerAccount } from './common/accounts.ts';
import { ConfigError } from './common/config.ts';
import { LEGACY_POLICY_CONTRACTS, SEPOLIA_CHAIN_ID } from './common/deployments.ts';
import {
  type ChainSafe,
  createGatewayClient,
  defaultGatewayUrl,
  type GatewayClient,
  spaceHoldsSafe,
} from './common/gateway.ts';
import { policyShowcaseSafe } from './common/known-safes.ts';
import { type Configuration, NO_SELECTOR } from './common/policies.ts';
import { CALL } from './common/safe.ts';

// ─── Fixed inputs ───────────────────────────────────────────────────────────

const SEPOLIA = String(SEPOLIA_CHAIN_ID);
const POLYGON = '137';

/**
 * The NativeTransferPolicy these requests bind. The legacy deployment: CGW stores the request
 * whatever the policy, but reports a root of it with an unknown type.
 */
const NATIVE_TRANSFER_POLICY = LEGACY_POLICY_CONTRACTS.nativeTransfer;

/** Stable, readable recipients: the last 20 bytes of keccak256(name). */
function namedAddress(name: string): Address {
  return getAddress(slice(keccak256(toHex(name)), 12));
}

const ALICE = namedAddress('alice');
const BOB = namedAddress('bob');

// ─── Options ────────────────────────────────────────────────────────────────

const { values } = parseArgs({
  options: {
    space: { type: 'string' },
    'sepolia-safe': { type: 'string' },
    'polygon-safe': { type: 'string' },
  },
});

/** Resolved in {@link main}, so a missing setting is reported rather than thrown at load. */
let gateway: GatewayClient;
let SAFES: Array<ChainSafe>;

// ─── Configurations ─────────────────────────────────────────────────────────

/** NATIVE_TRANSFER is stateless: one binding per allowed recipient. */
function allowRecipient(recipient: Address): Configuration {
  return {
    target: recipient,
    selector: NO_SELECTOR,
    operation: CALL,
    policy: NATIVE_TRANSFER_POLICY,
    data: '0x',
  };
}

/** The zero-address policy removes the binding of this access. */
function removeRecipient(recipient: Address): Configuration {
  return { ...allowRecipient(recipient), policy: zeroAddress };
}

// ─── CGW ────────────────────────────────────────────────────────────────────

async function storeRequest(args: {
  token: string;
  spaceId: string;
  safe: ChainSafe;
  label: string;
  configurations: Array<Configuration>;
}): Promise<void> {
  const root = await gateway.storeConfigurationRequest(args.token, {
    spaceId: args.spaceId,
    safe: args.safe,
    configurations: args.configurations,
  });
  console.log(`  ✓ ${args.safe.chainId} ${args.label}: ${root}`);
}

/** Creates a Space with a unique name; returns its UUID. */
async function createSpace(token: string): Promise<string> {
  const name = `policy requests ${Date.now()}`;
  const uuid = await gateway.createSpace(token, name);
  console.log(`  ✓ created "${name}" (${uuid})`);
  return uuid;
}

/** Adds the Safes the Space does not hold yet. */
async function addMissingSafes(token: string, spaceId: string): Promise<void> {
  const held = await gateway.listSpaceSafes(token, spaceId);
  const missing = SAFES.filter((safe) => !spaceHoldsSafe(held, safe));
  for (const safe of SAFES) {
    const mark = missing.includes(safe) ? '✓ adding' : '• already in';
    console.log(`  ${mark} ${safe.chainId}:${safe.address}`);
  }
  if (missing.length > 0) {
    await gateway.addSafesToSpace(token, spaceId, missing);
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const signer = signerAccount();
  gateway = createGatewayClient(defaultGatewayUrl());
  SAFES = [
    { chainId: SEPOLIA, address: getAddress(values['sepolia-safe'] ?? policyShowcaseSafe()) },
    { chainId: POLYGON, address: getAddress(values['polygon-safe'] ?? policyShowcaseSafe()) },
  ];

  console.log(`1. Sign in to ${gateway.url}`);
  const token = await gateway.signIn(signer, { chainId: SEPOLIA_CHAIN_ID });
  await gateway.registerUser(token);
  console.log(`  ✓ signed in as ${signer.address}`);

  console.log('\n2. Space');
  const spaceId = values.space ?? (await createSpace(token));
  await addMissingSafes(token, spaceId);

  console.log(`\n3. Configuration requests (Alice ${ALICE}, Bob ${BOB})`);
  for (const safe of SAFES) {
    await storeRequest({
      token,
      spaceId,
      safe,
      label: 'allow Alice + Bob',
      configurations: [allowRecipient(ALICE), allowRecipient(BOB)],
    });
    await storeRequest({
      token,
      spaceId,
      safe,
      label: 'remove Bob',
      configurations: [removeRecipient(BOB)],
    });
  }

  console.log(`\nSpace UUID: ${spaceId}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof ConfigError ? `✗ ${error.message}` : error);
  process.exit(1);
});
