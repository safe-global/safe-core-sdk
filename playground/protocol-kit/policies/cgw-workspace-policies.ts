// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * cgw-workspace-policies.ts: signs in to a Safe Client Gateway with PRIVATE_KEY and prints, for every
 * workspace (Space) that wallet belongs to, each Safe's active policies and its full pending
 * policies objects in a readable, indented form. Read-only: it never sends a transaction and never
 * changes a workspace.
 *
 *   node --env-file-if-exists=playground/protocol-kit/.env \
 *        playground/protocol-kit/policies/cgw-workspace-policies.ts [options]
 *
 * Settings come from the environment (see playground/protocol-kit/.example.env): PRIVATE_KEY (the
 * wallet that signs in), CGW_URL, and CGW_STAGING_URL for --staging. Run `--help` for the options.
 */

import { parseArgs } from 'node:util';
import { type Address, getAddress, isAddress, isAddressEqual } from 'viem';
import { signerAccount } from './common/accounts.ts';
import { ConfigError } from './common/config.ts';
import { SEPOLIA_CHAIN_ID } from './common/deployments.ts';
import { createGatewayClient, defaultGatewayUrl, type GatewayClient, stagingGatewayUrl } from './common/gateway.ts';
import { CGW_POLICY_TYPES } from './common/policies.ts';

// ─── Types ────────────────────────────────────────────────────────────────────────────────────────

type Workspace = {
  uuid: string;
  name: string;
  safeCount?: number;
  members?: Array<{ status?: string; role?: string; user?: { id?: number } }>;
};

/** Every policy and pending item names the Safe it belongs to; the rest of its shape varies by type. */
type SafeScoped = { safe?: { chainId?: string; address?: string } } & Record<string, unknown>;

type WorkspaceReport = {
  workspace: { uuid: string; name: string };
  safes: Array<{ chainId: string; address: Address }>;
  active: Array<SafeScoped>;
  pending: Array<SafeScoped>;
  error?: string;
};

type Options = {
  cgwUrl: string;
  siweDomain: string | undefined;
  workspace: string | undefined;
  safe: Address | undefined;
  types: Array<string>;
  json: boolean;
  curl: boolean;
};

// ─── CLI ──────────────────────────────────────────────────────────────────────────────────────────

const HELP = `Usage: node playground/protocol-kit/policies/cgw-workspace-policies.ts [options]

Signs in to the gateway with PRIVATE_KEY, then for each workspace of that wallet prints every Safe's
active policies and pending policies (the full objects, indented). Read-only.

Options
  --workspace <uuid|name>   Only this workspace (default: every workspace of the wallet)
  --safe <address>          Only this Safe
  --types <a,b,…>           Policy types to read (default: all: ${CGW_POLICY_TYPES.join(', ')})
  --staging                 Use CGW_STAGING_URL instead of CGW_URL
  --cgw-url <url>           Use this gateway instead
  --siwe-domain <host>      Bind the sign-in message to this host, for a gateway whose allow list
                            (auth.allowedSiweDomains) lacks its own
  --json                    Print the raw responses as JSON (e.g. to pipe into jq)
  --curl                    Also print, per workspace, a curl command for the pending policies API
                            that carries the access token. The token grants access to your
                            workspaces until it expires: do not paste it into shared places.
  -h, --help                Show this help

Environment (see playground/protocol-kit/.example.env)
  PRIVATE_KEY               The wallet that signs in. Required.
  CGW_URL, CGW_STAGING_URL  The default and the staging gateway.

Examples
  node --env-file-if-exists=playground/protocol-kit/.env playground/protocol-kit/policies/cgw-workspace-policies.ts
  … cgw-workspace-policies.ts --staging --workspace "my workspace"
  … cgw-workspace-policies.ts --safe 0x… --types native-transfer,erc20-transfer
  … cgw-workspace-policies.ts --json | jq '.[].pending'
  … cgw-workspace-policies.ts --workspace "my workspace" --curl
`;

function parseOptions(): Options | undefined {
  const { values } = parseArgs({
    options: {
      workspace: { type: 'string' },
      safe: { type: 'string' },
      types: { type: 'string' },
      staging: { type: 'boolean' },
      'cgw-url': { type: 'string' },
      'siwe-domain': { type: 'string' },
      json: { type: 'boolean' },
      curl: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(HELP);
    return undefined;
  }
  if (values.staging && values['cgw-url']) {
    throw new ConfigError('Pass --staging or --cgw-url, not both');
  }
  if (values.safe !== undefined && !isAddress(values.safe, { strict: false })) {
    throw new ConfigError(`--safe: "${values.safe}" is not an address`);
  }
  const types = (values.types ?? CGW_POLICY_TYPES.join(','))
    .split(',')
    .map((type) => type.trim())
    .filter((type) => type !== '');
  const unknown = types.filter((type) => !(CGW_POLICY_TYPES as ReadonlyArray<string>).includes(type));
  if (unknown.length > 0 || types.length === 0) {
    throw new ConfigError(`--types: unknown ${unknown.join(', ') || '(empty)'}; use any of ${CGW_POLICY_TYPES.join(', ')}`);
  }
  return {
    cgwUrl: values['cgw-url'] ?? (values.staging ? stagingGatewayUrl() : defaultGatewayUrl()),
    siweDomain: values['siwe-domain'],
    workspace: values.workspace,
    safe: values.safe ? getAddress(values.safe) : undefined,
    types,
    json: values.json ?? false,
    curl: values.curl ?? false,
  };
}

// ─── Gateway reads ────────────────────────────────────────────────────────────────────────────────

/**
 * `?types=a,b&safes=chainId:address,…` with the commas and colons left readable, as the gateway
 * expects them. {@link safes} narrows the read to those Safes (CAIP-10 style), else the whole Space.
 */
function policiesPath(
  spaceId: string,
  kind: 'active' | 'pending',
  options: Options,
  safes: ReadonlyArray<{ chainId: string; address: Address }> = [],
): string {
  const query = new URLSearchParams({ types: options.types.join(',') });
  if (kind === 'pending') {
    query.set('include_guard_installation', 'true');
  }
  if (safes.length > 0) {
    query.set('safes', safes.map((safe) => `${safe.chainId}:${safe.address}`).join(','));
  }
  return `/v1/spaces/${spaceId}/policies/${kind}?${query.toString().replaceAll('%2C', ',').replaceAll('%3A', ':')}`;
}

/**
 * A ready-to-run curl for each readable workspace's pending policies, authenticated with the
 * session's access token. With --safe, narrowed to that Safe.
 */
function printCurls(reports: ReadonlyArray<WorkspaceReport>, gateway: GatewayClient, token: string, options: Options): void {
  const readable = reports.filter((report) => !report.error);
  if (readable.length === 0) {
    return;
  }
  // The token is a credential: always to stderr, so `--json > file` never captures it.
  console.error('\nPending policies API (the access token below is a credential; it expires with the session):');
  for (const report of readable) {
    const path = policiesPath(report.workspace.uuid, 'pending', options, options.safe ? report.safes : []);
    console.error(`
  # ${report.workspace.name} (${report.workspace.uuid})
  curl -s '${gateway.url}${path}' \\
    -H 'Cookie: access_token=${token}' | jq`);
  }
}

async function readJson<T>(gateway: GatewayClient, path: string, token: string): Promise<T> {
  return (await (await gateway.request(path, { token })).json()) as T;
}

async function readWorkspace(
  gateway: GatewayClient,
  token: string,
  workspace: Workspace,
  options: Options,
): Promise<WorkspaceReport> {
  const report: WorkspaceReport = {
    workspace: { uuid: workspace.uuid, name: workspace.name },
    safes: [],
    active: [],
    pending: [],
  };
  try {
    const held = await gateway.listSpaceSafes(token, workspace.uuid);
    report.safes = Object.entries(held)
      .flatMap(([chainId, addresses]) => addresses.map((address) => ({ chainId, address: getAddress(address) })))
      .filter(({ address }) => !options.safe || isAddressEqual(address, options.safe));
    if (report.safes.length === 0) {
      return report;
    }
    const [active, pending] = await Promise.all([
      readJson<Array<SafeScoped>>(gateway, policiesPath(workspace.uuid, 'active', options), token),
      readJson<Array<SafeScoped>>(gateway, policiesPath(workspace.uuid, 'pending', options), token),
    ]);
    const selected = (item: SafeScoped): boolean =>
      !options.safe || (item.safe?.address !== undefined && isAddressEqual(item.safe.address as Address, options.safe));
    report.active = active.filter(selected);
    report.pending = pending.filter(selected);
  } catch (error) {
    // One unreadable workspace (e.g. a pending invitation) must not hide the others.
    report.error = error instanceof Error ? error.message : String(error);
  }
  return report;
}

// ─── Readable output ──────────────────────────────────────────────────────────────────────────────

/** A seconds or milliseconds timestamp field, e.g. `readyAt`, shown with its date. */
function describeScalar(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '–';
  }
  if (typeof value === 'number' && /(At|Time|timestamp)$/i.test(key) && value > 1_000_000_000) {
    const date = new Date(value > 1e12 ? value : value * 1000);
    return `${value} (${date.toISOString().replace('.000Z', 'Z')})`;
  }
  return String(value);
}

/** Prints any JSON value as an indented key/value tree; arrays become `-` lists. */
function printTree(value: unknown, indent: string, key = ''): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      console.log(`${indent}(none)`);
      return;
    }
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        // YAML style: the first field shares the `-` line, the rest align under it.
        const [first, ...rest] = Object.entries(item);
        if (first === undefined) {
          console.log(`${indent}- {}`);
          continue;
        }
        const [field, nested] = first;
        if (nested !== null && typeof nested === 'object') {
          console.log(`${indent}- ${field}:`);
          printTree(nested, `${indent}    `, field);
        } else {
          console.log(`${indent}- ${field}: ${describeScalar(field, nested)}`);
        }
        printTree(Object.fromEntries(rest), `${indent}  `, key);
      } else if (item !== null && typeof item === 'object') {
        console.log(`${indent}-`);
        printTree(item, `${indent}  `, key);
      } else {
        console.log(`${indent}- ${describeScalar(key, item)}`);
      }
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [field, nested] of Object.entries(value)) {
      const isEmptyArray = Array.isArray(nested) && nested.length === 0;
      if (nested !== null && typeof nested === 'object' && !isEmptyArray) {
        console.log(`${indent}${field}:`);
        printTree(nested, `${indent}  `, field);
      } else {
        console.log(`${indent}${field}: ${isEmptyArray ? '[]' : describeScalar(field, nested)}`);
      }
    }
    return;
  }
  console.log(`${indent}${describeScalar(key, value)}`);
}

/** One line naming an item: `native-transfer` or `delayed-guard-policies · pending-application`. */
function itemTitle(item: SafeScoped): string {
  const name = [item.type, item.kind].find((value) => typeof value === 'string') ?? 'item';
  return typeof item.status === 'string' ? `${name} · ${item.status}` : String(name);
}

function printItems(label: string, items: ReadonlyArray<SafeScoped>): void {
  console.log(`    ${label} (${items.length})`);
  if (items.length === 0) {
    console.log('      (none)');
    return;
  }
  items.forEach((item, index) => {
    // The Safe heads the section and the title line shows type/kind/status: no need to repeat them.
    const { safe: _safe, type: _type, kind: _kind, status: _status, ...rest } = item;
    console.log(`      [${index + 1}] ${itemTitle(item)}`);
    printTree(rest, '          ');
  });
}

function belongsTo(item: SafeScoped, safe: { chainId: string; address: Address }): boolean {
  return (
    item.safe?.chainId === safe.chainId &&
    item.safe.address !== undefined &&
    isAddressEqual(item.safe.address as Address, safe.address)
  );
}

function printReport(report: WorkspaceReport): void {
  const rule = '═'.repeat(100);
  console.log(`\n${rule}\nWorkspace "${report.workspace.name}" (${report.workspace.uuid})\n${rule}`);
  if (report.error) {
    console.log(`  ✗ could not read it: ${report.error}`);
    return;
  }
  if (report.safes.length === 0) {
    console.log('  no Safes');
    return;
  }
  for (const safe of report.safes) {
    console.log(`\n  Safe ${safe.address} on chain ${safe.chainId}`);
    printItems('Active policies', report.active.filter((item) => belongsTo(item, safe)));
    printItems('Pending policies', report.pending.filter((item) => belongsTo(item, safe)));
  }
  const listed = (item: SafeScoped): boolean => report.safes.some((safe) => belongsTo(item, safe));
  const orphans = [...report.active, ...report.pending].filter((item) => !listed(item));
  if (orphans.length > 0) {
    console.log('\n  Items for Safes not listed in the workspace');
    printItems('Items', orphans);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseOptions();
  if (!options) {
    return;
  }
  const signer = signerAccount();
  const gateway = createGatewayClient(options.cgwUrl);
  // Logs go to stderr with --json, so stdout stays valid JSON.
  const log = options.json ? console.error : console.log;

  log(`Signing in to ${gateway.url} as ${signer.address}`);
  const token = await gateway.signIn(signer, { chainId: SEPOLIA_CHAIN_ID, siweDomain: options.siweDomain });

  const all = (await gateway.listSpaces(token)) as Array<Workspace>;
  const workspaces = options.workspace
    ? all.filter((space) => space.uuid === options.workspace || space.name === options.workspace)
    : all;
  if (workspaces.length === 0) {
    const known = all.map((space) => `"${space.name}" (${space.uuid})`).join(', ') || 'none';
    throw new ConfigError(
      options.workspace
        ? `No workspace "${options.workspace}" for ${signer.address}; its workspaces: ${known}`
        : `${signer.address} belongs to no workspace on ${gateway.url}`,
    );
  }
  log(`${workspaces.length} workspace(s); types: ${options.types.join(', ')}`);

  const reports: Array<WorkspaceReport> = [];
  for (const workspace of workspaces) {
    reports.push(await readWorkspace(gateway, token, workspace, options));
  }

  if (options.json) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    reports.forEach(printReport);
  }
  if (options.curl) {
    printCurls(reports, gateway, token, options);
  }
  if (reports.some((report) => report.error)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof ConfigError ? `✗ ${error.message}` : `\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
