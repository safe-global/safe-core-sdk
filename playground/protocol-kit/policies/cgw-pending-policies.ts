// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * cgw-pending-policies.ts: puts Sepolia test Safes into each pending guard-policy state and checks
 * that a CGW reports it through `GET /v1/spaces/{spaceId}/policies/pending`.
 *
 * Depends only on `viem` and the shared `common/` modules next to it. Requires Node.js >= 22.18
 * (native TypeScript type stripping):
 *
 *   node --env-file-if-exists=playground/protocol-kit/.env \
 *        playground/protocol-kit/policies/cgw-pending-policies.ts <command> [options]
 *
 * Settings come from the environment (see playground/protocol-kit/.example.env). Run `--help` for
 * the commands, the states, the options and the variables.
 */

import { parseArgs } from 'node:util';
import {
  type Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress,
  type Hex,
  hashTypedData,
  http,
  isAddressEqual,
  type PublicClient,
  type WalletClient,
  zeroAddress,
} from 'viem';
import { generatePrivateKey, type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { GUARD_ABI, SAFE_ABI } from './common/abis.ts';
import { proposerAccount, signerAccount } from './common/accounts.ts';
import { ConfigError, envHint, requireEnv } from './common/config.ts';
import { findGuardDeployment, INDEXED_GUARDS, POLICY_CONTRACTS, SEPOLIA_CHAIN_ID } from './common/deployments.ts';
import {
  type ChainSafe,
  createGatewayClient,
  defaultGatewayUrl,
  type GatewayClient,
  spaceHoldsSafe,
  stagingGatewayUrl,
} from './common/gateway.ts';
import { policyTestSafes } from './common/known-safes.ts';
import { type Configuration, GUARD_POLICY_TYPES, NO_SELECTOR } from './common/policies.ts';
import {
  CALL,
  MODULE_GUARD_STORAGE_SLOT,
  preValidatedSignature,
  SAFE_TX_TYPES,
  TRANSACTION_GUARD_STORAGE_SLOT,
} from './common/safe.ts';
import { sleep, waitForBlockTimestamp } from './common/time.ts';

// ─── Fixed inputs ─────────────────────────────────────────────────────────────────────────────────

const CHAIN_ID = SEPOLIA_CHAIN_ID;
const EXPLORER_URL = 'https://sepolia.etherscan.io';

/** Label of the proposer delegate (PROPOSER_PRIVATE_KEY) on the Transaction Service. */
const DELEGATE_LABEL = 'pending-policies CLI';

/** Tags every proposal of this CLI, so `clean` deletes only its own; kept from the former name, so older proposals still match. */
const PROPOSAL_ORIGIN = 'pending-policies-cli';

const DEFAULT_SPACE_NAME = 'pending policies';

/** The gateways by name; their URLs come from CGW_URL and CGW_STAGING_URL. */
const GATEWAYS = {
  local: { url: defaultGatewayUrl, guardPoliciesEnabled: true },
  staging: { url: stagingGatewayUrl, guardPoliciesEnabled: true },
} as const;
type GatewayName = keyof typeof GATEWAYS;

/** The delay of the guard to target when the Safe has no indexed guard of its own. */
const DEFAULT_GUARD_DELAY_SECONDS = 60;

// ─── Pending states ───────────────────────────────────────────────────────────────────────────────

type PendingItemKind = 'delayed-guard-policies' | 'immediate-guard-policies' | 'guard-installation';

type StateDefinition = {
  /** The item CGW should report for the Safe. */
  kind: PendingItemKind;
  status: string;
  /** How the CLI builds the state, in one line. */
  recipe: string;
};

const PENDING_STATES = {
  draft: {
    kind: 'delayed-guard-policies',
    status: 'draft',
    recipe: 'store the configurations in CGW; nothing is queued or sent',
  },
  'configuration-in-signing': {
    kind: 'delayed-guard-policies',
    status: 'configuration-in-signing',
    recipe: 'store the configurations, queue requestConfiguration(root)',
  },
  'pending-application': {
    kind: 'delayed-guard-policies',
    status: 'pending-application',
    recipe: 'store the configurations, execute requestConfiguration(root) on chain',
  },
  'application-in-signing': {
    kind: 'delayed-guard-policies',
    status: 'application-in-signing',
    recipe: 'execute requestConfiguration(root), queue applyConfiguration without confirmations',
  },
  'application-ready': {
    kind: 'delayed-guard-policies',
    status: 'application-ready',
    recipe: 'execute requestConfiguration(root), wait for readyAt, queue a fully signed applyConfiguration',
  },
  'immediate-in-signing': {
    kind: 'immediate-guard-policies',
    status: 'in-signing',
    recipe: 'queue configureImmediately without enough confirmations',
  },
  'immediate-ready': {
    kind: 'immediate-guard-policies',
    status: 'ready',
    recipe: 'queue a fully signed configureImmediately',
  },
  'installation-in-signing': {
    kind: 'guard-installation',
    status: 'in-signing',
    recipe: 'queue setGuard(guard) without enough confirmations',
  },
  'installation-ready': {
    kind: 'guard-installation',
    status: 'ready',
    recipe: 'queue a fully signed setGuard(guard)',
  },
} as const satisfies Record<string, StateDefinition>;

type PendingState = keyof typeof PENDING_STATES;

const PENDING_STATE_NAMES = Object.keys(PENDING_STATES) as Array<PendingState>;

/** States that send `requestConfiguration` on chain, executed by the signer alone. */
const ON_CHAIN_REQUEST_STATES: ReadonlySet<PendingState> = new Set([
  'pending-application',
  'application-in-signing',
  'application-ready',
]);

/** States that queue nothing in the Transaction Service. */
const UNQUEUED_STATES: ReadonlySet<PendingState> = new Set(['draft', 'pending-application']);

/** States whose queued transaction carries every confirmation it needs. */
const FULLY_SIGNED_STATES: ReadonlySet<PendingState> = new Set([
  'application-ready',
  'immediate-ready',
  'installation-ready',
]);

// ─── Types ────────────────────────────────────────────────────────────────────────────────────────

type SafeCall = { to: Address; data: Hex };

type SafeState = {
  address: Address;
  version: string;
  owners: Array<Address>;
  threshold: number;
  nonce: number;
  transactionGuard: Address | null;
  moduleGuard: Address | null;
};

type PendingTransaction = { safeTxHash: Hex; confirmations: number; confirmationsRequired: number };

type PendingItem = {
  kind: string;
  status: string;
  safe: { chainId: string; address: Address };
  root?: Hex;
  guard?: Address | null;
  readyAt?: number | null;
  transaction?: PendingTransaction | null;
  safeTxHash?: Hex;
};

/** What `create` made, to find the matching item in the pending read. */
type CreatedState = { state: PendingState; root?: Hex; safeTxHash?: Hex };

type QueuedTransaction = { safeTxHash: Hex; nonce: number; proposer: Address | null; origin: string | null };

type Options = {
  command: Command;
  state: PendingState | undefined;
  gateway: GatewayName;
  cgwUrl: string;
  guardPoliciesEnabled: boolean;
  safe: Address | undefined;
  guard: Address | undefined;
  spaceId: string | undefined;
  spaceName: string;
  owner: PrivateKeyAccount;
  rpcUrl: string;
  timeoutSeconds: number;
};

type Context = {
  options: Options;
  gateway: GatewayClient;
  owner: PrivateKeyAccount;
  /** PROPOSER_PRIVATE_KEY, when set: needed only to queue "in signing" items on threshold-1 Safes. */
  delegate: PrivateKeyAccount | undefined;
  publicClient: PublicClient;
  walletClient: WalletClient;
  /** The Transaction Service the gateway reads the queue from. */
  txServiceUrl: string;
};

// ─── CLI ──────────────────────────────────────────────────────────────────────────────────────────

const COMMANDS = ['setup', 'status', 'create', 'check', 'clean', 'states'] as const;
type Command = (typeof COMMANDS)[number];

const HELP = `Usage: node playground/protocol-kit/policies/cgw-pending-policies.ts <command> [options]

Commands
  setup             Sign in, reuse or create the Space, add the test Safes it lacks.
  status            Show each test Safe on chain: owners, threshold, guards, queue, and the
                    pending states the signer can put it into.
  create <state>    Put --safe into <state>, then poll the gateway until it reports it.
  check             Read the pending policies of the Space (or of --safe) and print them.
                    With --expect <state>, fail unless --safe has an item in that state.
  clean             Delete the transactions this CLI queued for --safe (or every test Safe).
  states            List the pending states and how each is built.

States
${PENDING_STATE_NAMES.map((name) => `  ${name.padEnd(26)}${PENDING_STATES[name].recipe}`).join('\n')}

Options
  --gateway local|staging   The CGW to use: local is CGW_URL (${envHint('CGW_URL')}), staging is
                            CGW_STAGING_URL (${envHint('CGW_STAGING_URL')}). Default: local.
  --cgw-url URL             Another CGW; its guard-policies flag is taken from --guard-policies.
  --guard-policies on|off   Whether the gateway has FF_GUARD_POLICIES on (default: on). Off means
                            no guard item is expected at all.
  --safe 0x…                Narrow to one Safe. Required by create.
  --guard 0x…|<delay>       The guard for immediate and installation states: an address, or the
                            delay of an indexed guard (0, 60, 600, 3600, 86400). Default: the
                            Safe's own indexed guard, else the ${DEFAULT_GUARD_DELAY_SECONDS}s guard.
  --expect <state>          check: the state --safe must be reported in.
  --space UUID              The Space to use, by id.
  --space-name NAME         The Space to use, by name; created when missing (default:
                            "${DEFAULT_SPACE_NAME}").
  --rpc-url URL             Sepolia RPC (default: RPC_URL).
  --timeout SECONDS         How long create polls the gateway (default: 180). The gateway caches
                            the queue and the indexer state, so a new item can take a while.
  -h, --help                Show this help.

Environment (see playground/protocol-kit/.example.env)
  PRIVATE_KEY               Signer: an owner of the test Safes. Required.
  PROPOSER_PRIVATE_KEY      Proposer delegate, for "in signing" states on threshold-1 Safes.
  RPC_URL                   Sepolia JSON-RPC endpoint, unless --rpc-url is given.
  CGW_URL, CGW_STAGING_URL  The local and staging gateways.
  POLICY_TEST_SAFES         The test Safes, address[:label] comma-separated; --safe narrows to one.

Examples (with the variables loaded, e.g. node --env-file-if-exists=playground/protocol-kit/.env …)
  node cgw-pending-policies.ts status
  node cgw-pending-policies.ts create draft --safe <safe>
  node cgw-pending-policies.ts create application-ready --safe <safe>
  node cgw-pending-policies.ts create immediate-in-signing --safe <safe>
  node cgw-pending-policies.ts check --gateway staging --safe <safe>
  node cgw-pending-policies.ts clean --safe <safe>
`;

function parseOptions(): Options | undefined {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      gateway: { type: 'string' },
      'cgw-url': { type: 'string' },
      'guard-policies': { type: 'string' },
      safe: { type: 'string' },
      guard: { type: 'string' },
      expect: { type: 'string' },
      space: { type: 'string' },
      'space-name': { type: 'string' },
      'rpc-url': { type: 'string' },
      timeout: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const [command, stateArgument] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return undefined;
  }
  if (!isCommand(command)) {
    throw new Error(`Unknown command "${command}". Run with --help.`);
  }

  const gateway = values.gateway ?? 'local';
  if (gateway !== 'local' && gateway !== 'staging') {
    throw new Error(`--gateway must be local or staging, not "${gateway}"`);
  }

  const stateName = command === 'create' ? stateArgument : values.expect;
  if (command === 'create' && !stateName) {
    throw new Error(`create needs a state: ${PENDING_STATE_NAMES.join(', ')}`);
  }
  if (stateName !== undefined && !isPendingState(stateName)) {
    throw new Error(`Unknown state "${stateName}". One of: ${PENDING_STATE_NAMES.join(', ')}`);
  }

  const safe = values.safe ? getAddress(values.safe) : undefined;
  if ((command === 'create' || values.expect) && !safe) {
    throw new Error(`${command === 'create' ? 'create' : '--expect'} needs --safe`);
  }

  const guardPoliciesFlag = values['guard-policies'];
  if (guardPoliciesFlag !== undefined && guardPoliciesFlag !== 'on' && guardPoliciesFlag !== 'off') {
    throw new Error(`--guard-policies must be on or off, not "${guardPoliciesFlag}"`);
  }

  return {
    command,
    state: stateName,
    gateway,
    cgwUrl: (values['cgw-url'] ?? GATEWAYS[gateway].url()).replace(/\/$/, ''),
    guardPoliciesEnabled: guardPoliciesFlag ? guardPoliciesFlag === 'on' : GATEWAYS[gateway].guardPoliciesEnabled,
    safe,
    guard: values.guard ? parseGuard(values.guard) : undefined,
    spaceId: values.space,
    spaceName: values['space-name'] ?? DEFAULT_SPACE_NAME,
    owner: signerAccount(),
    rpcUrl: values['rpc-url'] ?? requireEnv('RPC_URL', 'a Sepolia JSON-RPC endpoint, or pass --rpc-url'),
    timeoutSeconds: values.timeout ? Number(values.timeout) : 180,
  };
}

function isCommand(value: string): value is Command {
  return (COMMANDS as ReadonlyArray<string>).includes(value);
}

function isPendingState(value: string): value is PendingState {
  return value in PENDING_STATES;
}

/** `--guard`: an address, or the delay of an indexed guard. */
function parseGuard(value: string): Address {
  if (value.startsWith('0x')) {
    return getAddress(value);
  }
  const indexed = INDEXED_GUARDS[Number(value)];
  if (!indexed) {
    throw new Error(`No indexed guard with a ${value}s delay. One of: ${Object.keys(INDEXED_GUARDS).join(', ')}`);
  }
  return indexed;
}

// ─── Output ───────────────────────────────────────────────────────────────────────────────────────

function heading(text: string): void {
  console.log(`\n${text}`);
}

function short(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-4)}`;
}

function guardLabel(guard: Address | null): string {
  if (!guard) {
    return 'none';
  }
  const deployment = findGuardDeployment(guard);
  if (!deployment) {
    return `${short(guard)} (unknown)`;
  }
  return deployment.indexed
    ? `${deployment.delaySeconds}s guard (indexed)`
    : `${deployment.delaySeconds}s legacy guard (not indexed, CGW ignores it)`;
}

function describeItem(item: PendingItem): string {
  const transaction = item.transaction;
  const reference = item.root
    ? `root ${short(item.root)}`
    : transaction
      ? `tx ${short(transaction.safeTxHash)}`
      : item.safeTxHash
        ? `tx ${short(item.safeTxHash)}`
        : '';
  const confirmations = transaction ? ` ${transaction.confirmations}/${transaction.confirmationsRequired} signed` : '';
  return `${item.kind.padEnd(25)} ${item.status.padEnd(25)} ${reference}${confirmations}`;
}

function printItems(items: ReadonlyArray<PendingItem>): void {
  if (items.length === 0) {
    console.log('  (no pending items)');
    return;
  }
  const bySafe = Map.groupBy(items, (item) => item.safe.address);
  for (const [address, safeItems] of bySafe) {
    console.log(`  ${address}`);
    for (const item of safeItems) {
      console.log(`    ${describeItem(item)}`);
    }
  }
}

// ─── Gateway ──────────────────────────────────────────────────────────────────────────────────────

function signIn(ctx: Context): Promise<string> {
  return ctx.gateway.signIn(ctx.owner, { chainId: CHAIN_ID });
}

function chainSafe(address: Address): ChainSafe {
  return { chainId: String(CHAIN_ID), address };
}

/**
 * Registers the user, then uses --space, else the Space named --space-name, else creates that
 * Space.
 */
async function ensureSpace(ctx: Context, token: string): Promise<string> {
  await ctx.gateway.registerUser(token);
  const spaces = await ctx.gateway.listSpaces(token);
  const existing = spaces.find((space) =>
    ctx.options.spaceId ? space.uuid === ctx.options.spaceId : space.name === ctx.options.spaceName,
  );
  if (existing) {
    console.log(`  • using Space "${existing.name}" (${existing.uuid})`);
    return existing.uuid;
  }
  if (ctx.options.spaceId) {
    throw new Error(`The signer is not a member of Space ${ctx.options.spaceId}`);
  }

  try {
    const uuid = await ctx.gateway.createSpace(token, ctx.options.spaceName);
    console.log(`  ✓ created Space "${ctx.options.spaceName}" (${uuid})`);
    return uuid;
  } catch (error) {
    const existingNames = spaces.map((space) => `"${space.name}" (${space.uuid})`).join(', ');
    throw new Error(
      `No Space "${ctx.options.spaceName}", and the gateway refused to create one: ${error instanceof Error ? error.message : error}\n` +
        `  Use one of the signer's Spaces with --space-name or --space: ${existingNames}`,
    );
  }
}

/**
 * Adds the Safes the Space does not hold yet, as many as it has free seats for. Returns the Safes
 * it could not add.
 */
async function addSafesToSpace(
  ctx: Context,
  token: string,
  spaceId: string,
  safes: ReadonlyArray<Address>,
): Promise<Array<Address>> {
  const held = await ctx.gateway.listSpaceSafes(token, spaceId);
  const missing = safes.filter((safe) => !spaceHoldsSafe(held, chainSafe(safe)));
  const freeSeats = missing.length === 0 ? null : await ctx.gateway.freeSafeSeats(token, spaceId);
  const toAdd = missing.slice(0, freeSeats ?? missing.length);

  for (const safe of safes) {
    const mark = !missing.includes(safe) ? '• already in' : toAdd.includes(safe) ? '✓ adding' : '✗ no seat for';
    console.log(`  ${mark} ${safe}`);
  }
  if (toAdd.length < missing.length) {
    console.log(`  ! The Space has ${freeSeats} free Safe seat(s) but needs ${missing.length}.`);
  }
  if (toAdd.length > 0) {
    await ctx.gateway.addSafesToSpace(token, spaceId, toAdd.map(chainSafe));
  }
  return missing.filter((safe) => !toAdd.includes(safe));
}

/** Stores the configurations behind a root in CGW: the root is then a draft. */
async function storeConfigurationRequest(
  ctx: Context,
  args: { token: string; spaceId: string; safe: Address; configurations: Array<Configuration> },
): Promise<Hex> {
  const root = await ctx.gateway.storeConfigurationRequest(args.token, {
    spaceId: args.spaceId,
    safe: chainSafe(args.safe),
    configurations: args.configurations,
  });
  console.log(`  ✓ stored the configurations in CGW: root ${root}`);
  return root;
}

function pendingPoliciesPath(spaceId: string, safe: Address | undefined): string {
  const query = new URLSearchParams({ types: GUARD_POLICY_TYPES.join(','), include_guard_installation: 'true' });
  if (safe) {
    query.set('safes', `${CHAIN_ID}:${safe}`);
  }
  return `/v1/spaces/${spaceId}/policies/pending?${query.toString().replaceAll('%2C', ',').replaceAll('%3A', ':')}`;
}

async function fetchPendingPolicies(
  ctx: Context,
  args: { token: string; spaceId: string; safe: Address | undefined },
): Promise<Array<PendingItem>> {
  const response = await ctx.gateway.request(pendingPoliciesPath(args.spaceId, args.safe), { token: args.token });
  return (await response.json()) as Array<PendingItem>;
}

// ─── Transaction Service ──────────────────────────────────────────────────────────────────────────

async function txServiceRequest(ctx: Context, path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  const response = await fetch(`${ctx.txServiceUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    throw new Error(`Transaction Service ${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`);
  }
  return response;
}

/** The time-based one-time value the Transaction Service binds delegate and delete signatures to. */
function currentTotp(): bigint {
  return BigInt(Math.floor(Date.now() / 1000 / 3600));
}

/** The proposer delegate; only the "in signing" states of a threshold-1 Safe need it. */
function requireDelegate(ctx: Context): PrivateKeyAccount {
  if (!ctx.delegate) {
    throw new ConfigError(
      'PROPOSER_PRIVATE_KEY is not set (a proposer delegate is needed to queue an unsigned transaction ' +
        'on a threshold-1 Safe): see playground/protocol-kit/.example.env',
    );
  }
  return ctx.delegate;
}

/** Registers the CLI's delegate on the Safe, signed by the owner as delegator. */
async function ensureDelegate(ctx: Context, safe: Address): Promise<void> {
  const delegate = requireDelegate(ctx);
  const listed = (await (await txServiceRequest(ctx, `/api/v2/delegates/?safe=${safe}&delegate=${delegate.address}`)).json()) as {
    count: number;
  };
  if (listed.count > 0) {
    return;
  }
  const signature = await ctx.owner.signTypedData({
    domain: { name: 'Safe Transaction Service', version: '1.0', chainId: CHAIN_ID },
    types: { Delegate: [{ name: 'delegateAddress', type: 'address' }, { name: 'totp', type: 'uint256' }] },
    primaryType: 'Delegate',
    message: { delegateAddress: delegate.address, totp: currentTotp() },
  });
  await txServiceRequest(ctx, '/api/v2/delegates/', {
    method: 'POST',
    body: { safe, delegate: delegate.address, delegator: ctx.owner.address, signature, label: DELEGATE_LABEL },
  });
  console.log(`  ✓ registered the proposer delegate ${delegate.address}`);
}

async function listQueuedTransactions(ctx: Context, safe: Address): Promise<Array<QueuedTransaction>> {
  const response = await txServiceRequest(ctx, `/api/v1/safes/${safe}/multisig-transactions/?executed=false&limit=100`);
  const { results } = (await response.json()) as { results: Array<QueuedTransaction> };
  return results;
}

/** The nonce after everything queued, so a proposal does not replace another. */
async function nextQueueNonce(ctx: Context, safe: SafeState): Promise<number> {
  const queued = await listQueuedTransactions(ctx, safe.address);
  const highestQueued = Math.max(-1, ...queued.map((transaction) => Number(transaction.nonce)));
  return Math.max(safe.nonce, highestQueued + 1);
}

/**
 * Queues a Safe transaction. An owner's proposal carries the owner's confirmation; the delegate's
 * carries none.
 */
async function proposeTransaction(
  ctx: Context,
  args: { safe: SafeState; call: SafeCall; proposer: PrivateKeyAccount; label: string },
): Promise<Hex> {
  const nonce = await nextQueueNonce(ctx, args.safe);
  const safeTx = {
    to: args.call.to,
    value: 0n,
    data: args.call.data,
    operation: CALL,
    safeTxGas: 0n,
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: zeroAddress,
    refundReceiver: zeroAddress,
    nonce: BigInt(nonce),
  };
  const typedData = {
    domain: { chainId: CHAIN_ID, verifyingContract: args.safe.address },
    types: SAFE_TX_TYPES,
    primaryType: 'SafeTx',
    message: safeTx,
  } as const;
  const safeTxHash = hashTypedData(typedData);
  const signature = await args.proposer.signTypedData(typedData);

  await txServiceRequest(ctx, `/api/v1/safes/${args.safe.address}/multisig-transactions/`, {
    method: 'POST',
    body: {
      ...safeTx,
      value: '0',
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      nonce: String(nonce),
      contractTransactionHash: safeTxHash,
      sender: args.proposer.address,
      signature,
      origin: PROPOSAL_ORIGIN,
    },
  });
  const proposedBy = isAddressEqual(args.proposer.address, ctx.owner.address) ? 'owner' : 'delegate';
  console.log(`  ✓ queued ${args.label} at nonce ${nonce}, proposed by the ${proposedBy}: ${safeTxHash}`);
  return safeTxHash;
}

/** Deletes a queued transaction; only its proposer may. */
async function deleteQueuedTransaction(ctx: Context, safe: Address, transaction: QueuedTransaction): Promise<void> {
  const proposer = [ctx.owner, ctx.delegate].find(
    (account) => account && transaction.proposer && isAddressEqual(account.address, transaction.proposer),
  );
  if (!proposer) {
    console.log(`  • skipped ${transaction.safeTxHash}: proposed by ${transaction.proposer}`);
    return;
  }
  const signature = await proposer.signTypedData({
    domain: { name: 'Safe Transaction Service', version: '1.0', chainId: CHAIN_ID, verifyingContract: safe },
    types: { DeleteRequest: [{ name: 'safeTxHash', type: 'bytes32' }, { name: 'totp', type: 'uint256' }] },
    primaryType: 'DeleteRequest',
    message: { safeTxHash: transaction.safeTxHash, totp: currentTotp() },
  });
  await txServiceRequest(ctx, `/api/v1/multisig-transactions/${transaction.safeTxHash}/`, {
    method: 'DELETE',
    body: { safeTxHash: transaction.safeTxHash, signature },
  });
  console.log(`  ✓ deleted nonce ${transaction.nonce}: ${transaction.safeTxHash}`);
}

// ─── Chain ────────────────────────────────────────────────────────────────────────────────────────

function isIndexedGuard(guard: Address): boolean {
  return findGuardDeployment(guard)?.indexed === true;
}

async function readGuardSlot(ctx: Context, safe: Address, slot: Hex): Promise<Address | null> {
  const value = await ctx.publicClient.getStorageAt({ address: safe, slot });
  if (!value || BigInt(value) === 0n) {
    return null;
  }
  return getAddress(`0x${value.slice(-40)}`);
}

async function readSafe(ctx: Context, address: Address): Promise<SafeState> {
  const read = <T,>(functionName: 'getOwners' | 'getThreshold' | 'nonce' | 'VERSION') =>
    ctx.publicClient.readContract({ address, abi: SAFE_ABI, functionName }) as Promise<T>;
  const [owners, threshold, nonce, version, transactionGuard, moduleGuard] = await Promise.all([
    read<ReadonlyArray<Address>>('getOwners'),
    read<bigint>('getThreshold'),
    read<bigint>('nonce'),
    read<string>('VERSION'),
    readGuardSlot(ctx, address, TRANSACTION_GUARD_STORAGE_SLOT),
    readGuardSlot(ctx, address, MODULE_GUARD_STORAGE_SLOT),
  ]);
  return { address, version, owners: [...owners], threshold: Number(threshold), nonce: Number(nonce), transactionGuard, moduleGuard };
}

function isOwner(safe: SafeState, account: PrivateKeyAccount): boolean {
  return safe.owners.some((owner) => isAddressEqual(owner, account.address));
}

/** The guard CGW reads delayed changes for: the Safe's indexed transaction guard, else module guard. */
function enabledIndexedGuard(safe: SafeState): Address | null {
  return [safe.transactionGuard, safe.moduleGuard].find((guard) => guard && isIndexedGuard(guard)) ?? null;
}

/** Executes a Safe transaction signed by the owner alone. Needs threshold 1. */
async function executeAsOwner(ctx: Context, safe: SafeState, call: SafeCall, label: string): Promise<void> {
  const { request } = await ctx.publicClient.simulateContract({
    account: ctx.owner,
    address: safe.address,
    abi: SAFE_ABI,
    functionName: 'execTransaction',
    // safeTxGas and gasPrice must be 0: the guard rejects anything else.
    args: [call.to, 0n, call.data, CALL, 0n, 0n, 0n, zeroAddress, zeroAddress, preValidatedSignature(ctx.owner.address)],
  });
  const hash = await ctx.walletClient.writeContract(request);
  console.log(`  → ${label}: ${EXPLORER_URL}/tx/${hash}`);
  const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    throw new Error(`${label} reverted: ${hash}`);
  }
  console.log(`  ✓ executed in block ${receipt.blockNumber}`);
}

/** When `applyConfiguration` becomes valid for the root; polled, as public RPCs can lag. */
async function waitForReadyAt(ctx: Context, guard: Address, safe: Address, root: Hex): Promise<bigint> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const readyAt = await ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'rootConfigured', args: [safe, root] });
    if (readyAt !== 0n) {
      return readyAt;
    }
    await sleep(3_000);
  }
  throw new Error(`The guard does not show root ${root} as requested`);
}

// ─── Configurations ───────────────────────────────────────────────────────────────────────────────

/**
 * A harmless change: allow ETH transfers to a fresh random recipient. Fresh per run, so the root
 * is new and `requestConfiguration` never collides with an earlier request.
 */
function allowNativeTransferToNewRecipient(): Array<Configuration> {
  const recipient = privateKeyToAccount(generatePrivateKey()).address;
  return [{ target: recipient, selector: NO_SELECTOR, operation: CALL, policy: POLICY_CONTRACTS.nativeTransfer, data: '0x' }];
}

// ─── Building a state ─────────────────────────────────────────────────────────────────────────────

/** Why the signer cannot build the state on the Safe, or `null` when it can. */
function blockerOf(state: PendingState, safe: SafeState, ctx: Context): string | null {
  if (state === 'draft') {
    return null;
  }
  if (!isOwner(safe, ctx.owner)) {
    return `the signer ${ctx.owner.address} is not an owner`;
  }
  const signerAloneSigns = safe.threshold === 1;
  if (FULLY_SIGNED_STATES.has(state) && !signerAloneSigns) {
    return `threshold ${safe.threshold}: the signer alone cannot fully sign`;
  }
  if (ON_CHAIN_REQUEST_STATES.has(state) && !signerAloneSigns) {
    return `threshold ${safe.threshold}: the signer alone cannot execute requestConfiguration`;
  }
  const isDelayedOnChain = PENDING_STATES[state].kind === 'delayed-guard-policies';
  if (isDelayedOnChain && !enabledIndexedGuard(safe)) {
    return 'no indexed guard is set on the Safe, so CGW reads no roots for it';
  }
  return null;
}

/** Who proposes so the transaction is in signing: an owner while threshold > 1, else the delegate. */
function inSigningProposer(ctx: Context, safe: SafeState): PrivateKeyAccount {
  return safe.threshold > 1 ? ctx.owner : requireDelegate(ctx);
}

function proposerFor(ctx: Context, state: PendingState, safe: SafeState): PrivateKeyAccount {
  return FULLY_SIGNED_STATES.has(state) ? ctx.owner : inSigningProposer(ctx, safe);
}

/** The guard of an immediate or installation state: --guard, the Safe's indexed guard, or the default. */
function targetGuard(ctx: Context, safe: SafeState): Address {
  return ctx.options.guard ?? enabledIndexedGuard(safe) ?? INDEXED_GUARDS[DEFAULT_GUARD_DELAY_SECONDS];
}

/** The guard to install: --guard, else an indexed guard the Safe does not already have. */
function guardToInstall(ctx: Context, safe: SafeState): Address {
  if (ctx.options.guard) {
    return ctx.options.guard;
  }
  const notInstalled = Object.values(INDEXED_GUARDS).find(
    (guard) => !safe.transactionGuard || !isAddressEqual(guard, safe.transactionGuard),
  );
  return notInstalled ?? INDEXED_GUARDS[DEFAULT_GUARD_DELAY_SECONDS];
}

async function buildState(
  ctx: Context,
  args: { state: PendingState; safe: SafeState; token: string; spaceId: string },
): Promise<CreatedState> {
  const { state, safe } = args;
  const proposer = proposerFor(ctx, state, safe);
  const proposesAsDelegate = !UNQUEUED_STATES.has(state) && !isAddressEqual(proposer.address, ctx.owner.address);
  if (proposesAsDelegate) {
    await ensureDelegate(ctx, safe.address);
  }

  const configurations = allowNativeTransferToNewRecipient();

  switch (state) {
    case 'immediate-in-signing':
    case 'immediate-ready': {
      const guard = targetGuard(ctx, safe);
      const data = encodeFunctionData({ abi: GUARD_ABI, functionName: 'configureImmediately', args: [configurations] });
      const safeTxHash = await proposeTransaction(ctx, { safe, call: { to: guard, data }, proposer, label: `configureImmediately on the ${guardLabel(guard)}` });
      return { state, safeTxHash };
    }
    case 'installation-in-signing':
    case 'installation-ready': {
      const guard = guardToInstall(ctx, safe);
      const data = encodeFunctionData({ abi: SAFE_ABI, functionName: 'setGuard', args: [guard] });
      const safeTxHash = await proposeTransaction(ctx, { safe, call: { to: safe.address, data }, proposer, label: `setGuard(${guardLabel(guard)})` });
      return { state, safeTxHash };
    }
    default:
      return await buildDelayedState(ctx, { ...args, configurations, proposer });
  }
}

/** Draft, then each later step of the delayed flow up to the requested state. */
async function buildDelayedState(
  ctx: Context,
  args: {
    state: PendingState;
    safe: SafeState;
    token: string;
    spaceId: string;
    configurations: Array<Configuration>;
    proposer: PrivateKeyAccount;
  },
): Promise<CreatedState> {
  const { state, safe, configurations, proposer } = args;
  const root = await storeConfigurationRequest(ctx, { token: args.token, spaceId: args.spaceId, safe: safe.address, configurations });
  if (state === 'draft') {
    return { state, root };
  }

  const guard = enabledIndexedGuard(safe);
  if (!guard) {
    throw new Error(`${safe.address} has no indexed guard`);
  }
  const requestCall = { to: guard, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'requestConfiguration', args: [root] }) };

  if (state === 'configuration-in-signing') {
    const safeTxHash = await proposeTransaction(ctx, { safe, call: requestCall, proposer, label: 'requestConfiguration(root)' });
    return { state, root, safeTxHash };
  }

  await executeAsOwner(ctx, safe, requestCall, `requestConfiguration(root) on the ${guardLabel(guard)}`);
  if (state === 'pending-application') {
    return { state, root };
  }

  const readyAt = await waitForReadyAt(ctx, guard, safe.address, root);
  if (state === 'application-ready') {
    await waitForBlockTimestamp(ctx.publicClient, readyAt, (secondsLeft) => console.log(`  … waiting ${secondsLeft}s for readyAt`));
  }
  // The request moved the Safe nonce on: read it again before queueing.
  const safeAfterRequest = await readSafe(ctx, safe.address);
  const applyCall = { to: guard, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'applyConfiguration', args: [configurations] }) };
  const safeTxHash = await proposeTransaction(ctx, { safe: safeAfterRequest, call: applyCall, proposer, label: 'applyConfiguration' });
  return { state, root, safeTxHash };
}

// ─── Verifying ────────────────────────────────────────────────────────────────────────────────────

const GUARD_ITEM_KINDS: ReadonlySet<string> = new Set(['delayed-guard-policies', 'immediate-guard-policies', 'guard-installation']);

function itemSafeTxHash(item: PendingItem): Hex | undefined {
  return item.transaction?.safeTxHash ?? item.safeTxHash;
}

/** The item `create` made, found by its root or by its queued transaction. */
function isCreatedItem(item: PendingItem, created: CreatedState): boolean {
  const { kind, status } = PENDING_STATES[created.state];
  if (item.kind !== kind || item.status !== status) {
    return false;
  }
  if (created.root) {
    return item.root === created.root;
  }
  return itemSafeTxHash(item) === created.safeTxHash;
}

/**
 * Polls the gateway until the result is what its guard-policies flag implies: with the flag on, the
 * created item; with it off, no guard item at all for the Safe.
 */
async function verifyReported(
  ctx: Context,
  args: { token: string; spaceId: string; safe: Address; created: CreatedState },
): Promise<boolean> {
  const { kind, status } = PENDING_STATES[args.created.state];
  const deadline = Date.now() + ctx.options.timeoutSeconds * 1000;
  for (let attempt = 1; ; attempt++) {
    const items = await fetchPendingPolicies(ctx, { token: args.token, spaceId: args.spaceId, safe: args.safe });
    const guardItems = items.filter((item) => GUARD_ITEM_KINDS.has(item.kind));

    if (!ctx.options.guardPoliciesEnabled) {
      printItems(items);
      if (guardItems.length === 0) {
        console.log('  ✓ PASS: no guard item, as expected with FF_GUARD_POLICIES off');
        return true;
      }
      console.log(`  ✗ FAIL: ${guardItems.length} guard item(s) reported with FF_GUARD_POLICIES off`);
      if (items.some((item) => isCreatedItem(item, args.created))) {
        console.log(`    The created item is reported as ${kind} / ${status}: the gateway behaves as if the flag were on.`);
        console.log('    Its build may predate the flag. Run with --guard-policies on to check the states themselves.');
      }
      return false;
    }

    const match = items.find((item) => isCreatedItem(item, args.created));
    if (match) {
      printItems(items);
      console.log(`  ✓ PASS: reported as ${kind} / ${status}`);
      return true;
    }
    if (Date.now() >= deadline) {
      printItems(items);
      console.log(`  ✗ FAIL: not reported as ${kind} / ${status} within ${ctx.options.timeoutSeconds}s`);
      console.log('    The gateway caches the queue and the indexer state: run `check --expect` again later.');
      return false;
    }
    const sameReference = items.filter((item) => (args.created.root ? item.root === args.created.root : itemSafeTxHash(item) === args.created.safeTxHash));
    const seenAs = sameReference.map((item) => `${item.kind} / ${item.status}`).join(', ') || 'not yet';
    console.log(`  … attempt ${attempt}: reported ${seenAs}; polling again in 5s`);
    await sleep(5_000);
  }
}

function printCurl(ctx: Context, token: string, spaceId: string, safe: Address | undefined): void {
  heading('Read it yourself:');
  console.log(`
  curl -s '${ctx.options.cgwUrl}${pendingPoliciesPath(spaceId, safe)}' \\
    -H 'Cookie: access_token=${token}' | jq`);
}

// ─── Commands ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Signs in and puts the Safes in the Space; returns a token and the Space. With --safe, fails when
 * that Safe could not be added: every later call would be refused.
 */
async function prepareSpace(ctx: Context, safes: ReadonlyArray<Address>): Promise<{ token: string; spaceId: string }> {
  heading(`Sign in to ${ctx.options.cgwUrl} as ${ctx.owner.address}`);
  const token = await signIn(ctx);
  console.log(`  ✓ signed in (guard-policies flag expected ${ctx.options.guardPoliciesEnabled ? 'on' : 'off'})`);
  heading('Space');
  const spaceId = await ensureSpace(ctx, token);
  const notAdded = await addSafesToSpace(ctx, token, spaceId, safes);
  if (ctx.options.safe && notAdded.length > 0) {
    throw new Error(`${ctx.options.safe} is not in the Space and could not be added: pick another Space with --space-name or --space`);
  }
  return { token, spaceId };
}

function selectedSafes(ctx: Context): Array<Address> {
  if (ctx.options.safe) {
    return [ctx.options.safe];
  }
  const safes = policyTestSafes();
  if (safes.length === 0) {
    throw new ConfigError('POLICY_TEST_SAFES lists no Safes and no --safe was given: see playground/protocol-kit/.example.env');
  }
  return safes.map((safe) => safe.address);
}

async function setupCommand(ctx: Context): Promise<void> {
  const { token, spaceId } = await prepareSpace(ctx, selectedSafes(ctx));
  printCurl(ctx, token, spaceId, ctx.options.safe);
}

async function statusCommand(ctx: Context): Promise<void> {
  heading(`Test Safes on Sepolia (signer ${ctx.owner.address})`);
  for (const address of selectedSafes(ctx)) {
    const note = policyTestSafes().find((safe) => isAddressEqual(safe.address, address))?.label ?? '';
    const [safe, queued] = await Promise.all([readSafe(ctx, address), listQueuedTransactions(ctx, address)]);
    const possible = PENDING_STATE_NAMES.filter((state) => blockerOf(state, safe, ctx) === null);
    console.log(`\n  ${address}  ${note}`);
    console.log(`    v${safe.version} · ${safe.threshold} of ${safe.owners.length} · signer ${isOwner(safe, ctx.owner) ? 'is' : 'is NOT'} an owner · nonce ${safe.nonce} · ${queued.length} queued`);
    console.log(`    transaction guard: ${guardLabel(safe.transactionGuard)} · module guard: ${guardLabel(safe.moduleGuard)}`);
    console.log(`    can create: ${possible.join(', ') || 'nothing'}`);
  }
}

async function createCommand(ctx: Context): Promise<void> {
  const state = ctx.options.state as PendingState;
  const safeAddress = ctx.options.safe as Address;
  const safe = await readSafe(ctx, safeAddress);
  const blocker = blockerOf(state, safe, ctx);
  if (blocker) {
    throw new Error(`Cannot create ${state} on ${safeAddress}: ${blocker}. Run status to see what each Safe allows.`);
  }

  const { token, spaceId } = await prepareSpace(ctx, [safeAddress]);
  heading(`Create ${state} on ${safeAddress}: ${PENDING_STATES[state].recipe}`);
  const created = await buildState(ctx, { state, safe, token, spaceId });

  heading(`Verify on ${ctx.options.cgwUrl}`);
  // Sign in again: a slow state (waiting for readyAt) can outlive a token.
  const freshToken = await signIn(ctx);
  const passed = await verifyReported(ctx, { token: freshToken, spaceId, safe: safeAddress, created });
  printCurl(ctx, freshToken, spaceId, safeAddress);
  if (!passed) {
    process.exitCode = 1;
  }
}

async function checkCommand(ctx: Context): Promise<void> {
  const { token, spaceId } = await prepareSpace(ctx, selectedSafes(ctx));
  heading(`Pending guard items on ${ctx.options.cgwUrl}`);
  const items = await fetchPendingPolicies(ctx, { token, spaceId, safe: ctx.options.safe });
  printItems(items);

  const expected = ctx.options.state;
  if (expected) {
    const { kind, status } = PENDING_STATES[expected];
    const reported = items.some((item) => item.kind === kind && item.status === status);
    const passed = ctx.options.guardPoliciesEnabled ? reported : !items.some((item) => GUARD_ITEM_KINDS.has(item.kind));
    const expectation = ctx.options.guardPoliciesEnabled ? `an item ${kind} / ${status}` : 'no guard item (flag off)';
    console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}: expected ${expectation}`);
    if (!passed) {
      process.exitCode = 1;
    }
  }
  printCurl(ctx, token, spaceId, ctx.options.safe);
}

async function cleanCommand(ctx: Context): Promise<void> {
  heading(`Delete the transactions this CLI queued (origin "${PROPOSAL_ORIGIN}")`);
  for (const safe of selectedSafes(ctx)) {
    const ours = (await listQueuedTransactions(ctx, safe)).filter((transaction) => transaction.origin?.includes(PROPOSAL_ORIGIN));
    console.log(`  ${safe}: ${ours.length} queued by this CLI`);
    for (const transaction of ours) {
      await deleteQueuedTransaction(ctx, safe, transaction);
    }
  }
  console.log('\n  Drafts stored in CGW and roots requested on chain are left as they are.');
}

function statesCommand(): void {
  heading('Pending states (kind / status CGW reports) and how each is built');
  for (const name of PENDING_STATE_NAMES) {
    const { kind, status, recipe } = PENDING_STATES[name];
    console.log(`  ${name.padEnd(26)}${`${kind} / ${status}`.padEnd(52)}${recipe}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseOptions();
  if (!options) {
    return;
  }
  if (options.command === 'states') {
    statesCommand();
    return;
  }

  const transport = http(options.rpcUrl);
  const chainId = await createPublicClient({ transport }).getChainId();
  if (chainId !== CHAIN_ID) {
    throw new ConfigError(`The RPC is on chain ${chainId}; this CLI runs on Sepolia (${CHAIN_ID})`);
  }
  const gateway = createGatewayClient(options.cgwUrl);
  const ctx: Context = {
    options,
    gateway,
    owner: options.owner,
    delegate: proposerAccount(),
    publicClient: createPublicClient({ chain: sepolia, transport }),
    walletClient: createWalletClient({ account: options.owner, chain: sepolia, transport }),
    txServiceUrl: await gateway.readTransactionServiceUrl(CHAIN_ID),
  };

  const commands: Record<Exclude<Command, 'states'>, (context: Context) => Promise<void>> = {
    setup: setupCommand,
    status: statusCommand,
    create: createCommand,
    check: checkCommand,
    clean: cleanCommand,
  };
  await commands[options.command](ctx);
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
