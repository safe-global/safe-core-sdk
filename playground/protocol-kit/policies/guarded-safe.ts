// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * guarded-safe.ts: sets up, inspects and tears down a Safe protected by the SafePolicyGuard
 * policy engine, together with an AllowanceModule spending limit.
 *
 * Depends only on `viem` and the shared `common/` modules next to it. Requires Node.js >= 22.18
 * (native TypeScript type stripping). Run it from any directory where `viem` resolves:
 *
 *   node playground/protocol-kit/policies/guarded-safe.ts <command> [options]
 *
 * Commands
 *   status     Print the Safe's owners, guards, modules, spending limits and every policy binding
 *              it has on any known SafePolicyGuard. Never sends a transaction.
 *   setup      Deploy the Safe for --salt-nonce if it does not exist, top up its balances, then in
 *              ONE Safe transaction (a MultiSendCallOnly batch):
 *                enable the AllowanceModule, add the delegate, set the ETH and token allowances,
 *                configure every policy on the guard (`configureImmediately`), install the guard as
 *                the transaction guard (`setGuard`) and as the module guard (`setModuleGuard`).
 *              Then runs `transact` unless --skip-transactions is given.
 *   transact   Exercise the policies: a Safe token transfer and a Safe ETH transfer to --transfer-to,
 *              the same two through the AllowanceModule (when the delegate is the signer), and a
 *              simulated transfer to an address outside the allowlist, which must be rejected.
 *   teardown   Remove everything `setup` creates: the transaction and module guards, every policy
 *              binding the Safe has on any known guard, pending configuration requests, the
 *              AllowanceModule delegates and the module itself (--keep-spending-limits keeps those).
 *              Removing an installed transaction guard is time-locked by the guard itself: the script
 *              requests an AllowPolicy binding for `setGuard`, waits out the guard's DELAY, applies
 *              it, and only then removes the guard.
 *
 * Policies configured by `setup` (select with --policies, all by default)
 *   native-transfer   NativeTransferPolicy: plain ETH transfers to each --recipients address.
 *   erc20-transfer    ERC20TransferPolicy: `transfer`/`transferFrom` of --token to --recipients.
 *   erc20-approve     ERC20ApprovePolicy: `approve` of --token for --spenders.
 *   owner-management  AllowPolicy: addOwnerWithThreshold, removeOwner, swapOwner, changeThreshold.
 *   enable-module     AllowPolicy: enableModule.
 *   multisend         MultiSendPolicy: batches through MultiSendCallOnly and MultiSend 1.5.0, so every
 *                     call inside a batch is checked against the policies above.
 *   spending-limit    AllowanceModule: --delegate may spend --eth-allowance ETH and --token-allowance
 *                     tokens every --allowance-reset-minutes. Not a guard binding: with the module
 *                     guard installed, every allowance transfer is still checked by the transfer
 *                     policies above, so it can only pay an allowlisted recipient.
 *   Anything not bound is denied: no fallback policy is configured.
 *
 * Configuration
 *   Environment-specific settings are read from the environment, never hard-coded; every variable is
 *   documented in playground/protocol-kit/.example.env. Copy it to playground/protocol-kit/.env and
 *   let Node load it (variables already in the environment win, e.g. from CI or a secret manager):
 *
 *     node --env-file-if-exists=playground/protocol-kit/.env playground/protocol-kit/policies/guarded-safe.ts <command>
 *
 * Examples (with the variables loaded as above; `pgs` stands for that command)
 *   # Inspect the Safe for the default salt nonce (1001)
 *   pgs status
 *
 *   # Preview a full setup without sending anything (simulates what current state allows)
 *   pgs setup --dry-run
 *
 *   # Set up a fresh Safe with another salt, on the 600 second guard, only two policies
 *   pgs setup --salt-nonce 2001 --guard-delay 600 --policies native-transfer,erc20-transfer
 *
 *   # Another chain: its RPC and token
 *   pgs setup --rpc-url https://polygon-rpc.example --token 0x…
 *
 *   # Clean up an existing Safe
 *   pgs teardown --safe 0x…
 *
 * Signing
 *   Every Safe transaction is executed by the signer alone with a pre-validated signature, so the
 *   signer must be an owner and the Safe's threshold must be 1. The key is read from PRIVATE_KEY
 *   only; keys are never accepted as arguments, which would leak them to shell history.
 *
 * RPC
 *   Reads and transactions go to --rpc-url, else RPC_URL; the chain is the RPC's. `status` and
 *   `teardown` also read past PolicyConfirmed events, which most public endpoints prune, so those go
 *   to --logs-rpc-url, else LOGS_RPC_URL, else the main RPC: use an endpoint that serves archive
 *   logs. A capped log range is handled by chunking; raise --from-block to scan less.
 *
 * Contracts
 *   The policy contracts and guards are the deployments the policy indexer watches, so
 *   everything configured here is visible to the Safe{Wallet} Policies page. Each address can be
 *   overridden (see --help); every contract used is checked for code before anything is sent.
 */

import { parseArgs } from 'node:util';
import {
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
  BaseError,
  concat,
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  encodeFunctionData,
  encodePacked,
  formatEther,
  formatUnits,
  getAddress,
  getContractAddress,
  http,
  isAddress,
  isAddressEqual,
  keccak256,
  pad,
  parseEther,
  parseTransaction,
  parseUnits,
  toFunctionSelector,
  zeroAddress,
} from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import {
  ALLOWANCE_MODULE_ABI,
  ERC20_ABI,
  GUARD_ABI,
  GUARD_ERRORS_ABI,
  POLICY_CONFIRMED_EVENT,
  PROXY_FACTORY_ABI,
  ROOT_CONFIGURED_EVENT,
  SAFE_ABI,
} from './common/abis.ts';
import { coOwner, signerAccount, trustedAddress } from './common/accounts.ts';
import { envAddress, envHint, envString, requireEnv } from './common/config.ts';
import {
  guardName,
  INDEXED_GUARDS,
  LEGACY_GUARDS,
  POLICY_CONTRACTS,
  policyContractName,
  SAFE_V150,
} from './common/deployments.ts';
import { describeError } from './common/errors.ts';
import {
  type AllowlistEntry,
  type Configuration,
  configurationRoot,
  encodeAllowlist,
  NO_SELECTOR,
  packAccess,
} from './common/policies.ts';
import {
  CALL,
  DELEGATECALL,
  encodeMultiSend,
  type MetaTransaction,
  MODULE_GUARD_STORAGE_SLOT,
  preValidatedSignature,
  SENTINEL_ADDRESS,
  TRANSACTION_GUARD_STORAGE_SLOT,
} from './common/safe.ts';
import { sleep } from './common/time.ts';

// ─── Deployments ──────────────────────────────────────────────────────────────────────────────────

const DEFAULT_SALT_NONCE = 1001n;

/** Public, per-chain facts; endpoints and tokens are configuration (RPC_URL, TEST_TOKEN, …). */
type ChainDefaults = {
  name: string;
  nativeSymbol: string;
  explorer: string;
  /** The AllowanceModule deployment the policy indexer watches on this chain. */
  allowanceModule: Address;
};

const CHAIN_DEFAULTS: Record<number, ChainDefaults> = {
  1: {
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    explorer: 'https://etherscan.io',
    allowanceModule: '0x691f59471Bfd2B7d639DCF74671a2d648ED1E331',
  },
  137: {
    name: 'Polygon',
    nativeSymbol: 'POL',
    explorer: 'https://polygonscan.com',
    allowanceModule: '0x691f59471Bfd2B7d639DCF74671a2d648ED1E331',
  },
  11155111: {
    name: 'Sepolia',
    nativeSymbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    allowanceModule: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134',
  },
};

// ─── Domain ───────────────────────────────────────────────────────────────────────────────────────

const NATIVE_TOKEN: Address = zeroAddress;

const SELECTORS = {
  transfer: toFunctionSelector('function transfer(address,uint256)'),
  transferFrom: toFunctionSelector('function transferFrom(address,address,uint256)'),
  approve: toFunctionSelector('function approve(address,uint256)'),
  multiSend: toFunctionSelector('function multiSend(bytes)'),
  addOwnerWithThreshold: toFunctionSelector('function addOwnerWithThreshold(address,uint256)'),
  removeOwner: toFunctionSelector('function removeOwner(address,address,uint256)'),
  swapOwner: toFunctionSelector('function swapOwner(address,address,address)'),
  changeThreshold: toFunctionSelector('function changeThreshold(uint256)'),
  enableModule: toFunctionSelector('function enableModule(address)'),
  setGuard: toFunctionSelector('function setGuard(address)'),
  setModuleGuard: toFunctionSelector('function setModuleGuard(address)'),
  disableModule: toFunctionSelector('function disableModule(address,address)'),
  setFallbackHandler: toFunctionSelector('function setFallbackHandler(address)'),
} as const;

const SELECTOR_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SELECTORS).map(([name, selector]) => [selector, name]),
);

const POLICY_KINDS = [
  'native-transfer',
  'erc20-transfer',
  'erc20-approve',
  'owner-management',
  'enable-module',
  'multisend',
  'spending-limit',
] as const;
type PolicyKind = (typeof POLICY_KINDS)[number];

type Contracts = {
  allowPolicy: Address;
  nativeTransferPolicy: Address;
  erc20TransferPolicy: Address;
  erc20ApprovePolicy: Address;
  multiSendPolicy: Address;
  allowanceModule: Address;
  multiSendCallOnly: Address;
  multiSend: Address;
  safeSingleton: Address;
  proxyFactory: Address;
  fallbackHandler: Address;
};

type Options = {
  command: 'status' | 'setup' | 'transact' | 'teardown';
  rpcUrl: string;
  logsRpcUrl: string;
  chainId: number;
  chain: Chain;
  nativeSymbol: string;
  explorer: string | undefined;
  account: PrivateKeyAccount;
  safe: Address | undefined;
  saltNonce: bigint;
  owners: Address[];
  threshold: bigint;
  guard: Address;
  token: Address | undefined;
  recipients: AllowlistEntry[];
  spenders: AllowlistEntry[];
  delegate: Address;
  ethAllowance: string;
  tokenAllowance: string;
  allowanceResetMinutes: number;
  policies: ReadonlySet<PolicyKind>;
  fundEth: string;
  fundToken: string;
  transferTo: Address;
  transferEth: string;
  transferToken: string;
  skipTransactions: boolean;
  keepSpendingLimits: boolean;
  fromBlock: bigint;
  dryRun: boolean;
  contracts: Contracts;
};

/**
 * What this run has seen of the chain, so a load-balanced RPC cannot answer from a node that has not
 * caught up with it (see `consistentTransport`).
 */
type SyncState = {
  /** No read is served from a block older than this: the newest block a transaction of ours landed in. */
  minBlock: bigint;
  /** No nonce below this is used: one past the last transaction this run sent. */
  nextNonce: number;
};

type Context = {
  options: Options;
  sync: SyncState;
  publicClient: PublicClient;
  logsClient: PublicClient;
  walletClient: WalletClient;
};

// ─── CLI ──────────────────────────────────────────────────────────────────────────────────────────

const HELP = `Usage: node playground/protocol-kit/policies/guarded-safe.ts <status|setup|transact|teardown> [options]

Safe
  --safe <address>                  Act on this Safe instead of the one derived from --salt-nonce
  --salt-nonce <n>                  Salt nonce of the Safe to use or deploy        (default ${DEFAULT_SALT_NONCE})
  --owners <a,b,…>                  Owners of a Safe deployed by setup      (default <signer>,${envHint('CO_OWNER')})
  --threshold <n>                   Threshold of a Safe deployed by setup          (default 1)

Network
  --rpc-url <url>                   JSON-RPC endpoint for reads and transactions   (default RPC_URL)
  --chain-id <id>                   Fail unless the RPC is on this chain
  --logs-rpc-url <url>              Endpoint for historical event logs   (default LOGS_RPC_URL, else the RPC)
  --from-block <n>                  First block scanned for policy events          (default 0)

Policies
  --guard-delay <seconds>           SafePolicyGuard by delay: ${Object.keys(INDEXED_GUARDS).join(', ')}  (default 60)
  --guard <address>                 Any SafePolicyGuard, instead of --guard-delay
  --policies <a,b,…>                Subset of: ${POLICY_KINDS.join(', ')}  (default all)
  --token <address>                 ERC-20 for the token policies and allowance    (default ${envHint('TEST_TOKEN')})
  --recipients <a[:once|always],…>  Transfer allowlist (ETH and token) (default ${envHint('CO_OWNER')}, <signer>, ${envHint('TRUSTED_ADDRESS')}:once)
  --spenders <a[:once|always],…>    Approve allowlist                  (default ${envHint('CO_OWNER')}, ${envHint('TRUSTED_ADDRESS')}:once)
  --delegate <address>              Spending limit delegate                        (default <signer>)
  --eth-allowance <eth>             ETH spending limit per period                  (default 0.001)
  --token-allowance <amount>        Token spending limit per period                (default 100)
  --allowance-reset-minutes <n>     Spending limit period, 0 = one-off             (default 1440)

Funding and test transactions
  --fund-eth <eth>                  Top the Safe up to this ETH balance            (default 0.001)
  --fund-token <amount>             Top the Safe up to this token balance          (default 100)
  --transfer-to <address>           Recipient of the test transfers                (default ${envHint('CO_OWNER')})
  --transfer-eth <eth>              ETH per test transfer                          (default 0.00001)
  --transfer-token <amount>         Tokens per test transfer                       (default 1)
  --skip-transactions               setup: do not run the test transactions afterwards

Teardown
  --keep-spending-limits            Keep the AllowanceModule, its delegates and allowances

Contract overrides (defaults: the deployments the policy indexer watches)
  --allow-policy, --native-transfer-policy, --erc20-transfer-policy, --erc20-approve-policy,
  --multisend-policy, --allowance-module, --multisend-call-only, --multisend,
  --safe-singleton, --proxy-factory, --fallback-handler

  --dry-run                         Simulate what the current state allows; send nothing
  -h, --help                        Show this help

Environment (see playground/protocol-kit/.example.env)
  PRIVATE_KEY                       Signer key: an owner of the Safe. Required.
  RPC_URL, LOGS_RPC_URL             Defaults of --rpc-url and --logs-rpc-url.
  CO_OWNER                          Second owner of a derived Safe; default test-transfer recipient.
  TRUSTED_ADDRESS                   Single-use ("once") entry of the default allowlists.
  TEST_TOKEN                        Default of --token.
`;

class UsageError extends Error {}

const requireAddress = (value: string, flag: string): Address => {
  const trimmed = value.trim();
  if (!isAddress(trimmed, { strict: false })) throw new UsageError(`${flag}: "${value}" is not an address`);
  return getAddress(trimmed);
};

const parseAddressList = (value: string, flag: string): Address[] =>
  value
    .split(',')
    .filter((part) => part.trim() !== '')
    .map((part) => requireAddress(part, flag));

const parseAllowlist = (value: string, flag: string): AllowlistEntry[] => {
  const entries = value
    .split(',')
    .filter((part) => part.trim() !== '')
    .map((part): AllowlistEntry => {
      const [address, permission = 'always'] = part.split(':').map((piece) => piece.trim());
      if (permission !== 'once' && permission !== 'always') {
        throw new UsageError(`${flag}: permission "${permission}" must be "once" or "always"`);
      }
      return { address: requireAddress(address, flag), permission };
    });
  const seen = new Set<string>();
  for (const { address } of entries) {
    if (seen.has(address)) throw new UsageError(`${flag}: ${address} is listed twice`);
    seen.add(address);
  }
  if (entries.length === 0) throw new UsageError(`${flag}: at least one address is required`);
  return entries;
};

const parseBigInt = (value: string, flag: string, min = 0n): bigint => {
  if (!/^\d+$/.test(value.trim())) throw new UsageError(`${flag}: "${value}" is not a non-negative integer`);
  const parsed = BigInt(value.trim());
  if (parsed < min) throw new UsageError(`${flag}: must be at least ${min}`);
  return parsed;
};

const parseDecimal = (value: string, flag: string): string => {
  if (!/^\d+(\.\d+)?$/.test(value.trim())) throw new UsageError(`${flag}: "${value}" is not a decimal amount`);
  return value.trim();
};

const parsePolicies = (value: string): Set<PolicyKind> => {
  const kinds = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  for (const kind of kinds) {
    if (!(POLICY_KINDS as readonly string[]).includes(kind)) {
      throw new UsageError(`--policies: unknown "${kind}"; expected ${POLICY_KINDS.join(', ')}`);
    }
  }
  if (kinds.length === 0) throw new UsageError('--policies: at least one policy is required');
  return new Set(kinds as PolicyKind[]);
};

const addressOption = { type: 'string' } as const;

async function parseOptions(): Promise<Options | undefined> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      safe: addressOption,
      'salt-nonce': { type: 'string' },
      owners: { type: 'string' },
      threshold: { type: 'string' },
      'rpc-url': { type: 'string' },
      'chain-id': { type: 'string' },
      'logs-rpc-url': { type: 'string' },
      'from-block': { type: 'string' },
      'guard-delay': { type: 'string' },
      guard: addressOption,
      policies: { type: 'string' },
      token: addressOption,
      recipients: { type: 'string' },
      spenders: { type: 'string' },
      delegate: addressOption,
      'eth-allowance': { type: 'string' },
      'token-allowance': { type: 'string' },
      'allowance-reset-minutes': { type: 'string' },
      'fund-eth': { type: 'string' },
      'fund-token': { type: 'string' },
      'transfer-to': addressOption,
      'transfer-eth': { type: 'string' },
      'transfer-token': { type: 'string' },
      'skip-transactions': { type: 'boolean' },
      'keep-spending-limits': { type: 'boolean' },
      'allow-policy': addressOption,
      'native-transfer-policy': addressOption,
      'erc20-transfer-policy': addressOption,
      'erc20-approve-policy': addressOption,
      'multisend-policy': addressOption,
      'allowance-module': addressOption,
      'multisend-call-only': addressOption,
      multisend: addressOption,
      'safe-singleton': addressOption,
      'proxy-factory': addressOption,
      'fallback-handler': addressOption,
      'dry-run': { type: 'boolean' },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    return undefined;
  }
  const [command, ...extra] = positionals;
  if (command !== 'status' && command !== 'setup' && command !== 'transact' && command !== 'teardown') {
    throw new UsageError(`Unknown command "${command}"`);
  }
  if (extra.length > 0) throw new UsageError(`Unexpected arguments: ${extra.join(' ')}`);

  // The chain decides every default, so it is resolved first, from the RPC.
  const requestedChainId = values['chain-id'] ? Number(parseBigInt(values['chain-id'], '--chain-id', 1n)) : undefined;
  const rpcUrl = values['rpc-url'] ?? requireEnv('RPC_URL', 'the JSON-RPC endpoint, or pass --rpc-url');
  const chainId = await createPublicClient({ transport: http(rpcUrl, { retryCount: 5 }) }).getChainId();
  if (requestedChainId !== undefined && requestedChainId !== chainId) {
    throw new UsageError(`--chain-id ${requestedChainId} does not match the RPC's chain ${chainId}`);
  }
  const defaults = CHAIN_DEFAULTS[chainId];

  const account = signerAccount();

  let guard: Address;
  if (values.guard) {
    if (values['guard-delay']) throw new UsageError('Pass --guard or --guard-delay, not both');
    guard = requireAddress(values.guard, '--guard');
  } else {
    const delay = Number(parseBigInt(values['guard-delay'] ?? '60', '--guard-delay'));
    const indexed = INDEXED_GUARDS[delay];
    if (!indexed) {
      throw new UsageError(
        `--guard-delay: no indexed SafePolicyGuard with a ${delay}s delay; use one of ${Object.keys(INDEXED_GUARDS).join(', ')} or --guard`,
      );
    }
    guard = indexed;
  }

  const policies = values.policies ? parsePolicies(values.policies) : new Set<PolicyKind>(POLICY_KINDS);
  const token = values.token ? requireAddress(values.token, '--token') : envAddress('TEST_TOKEN');
  const needsToken = policies.has('erc20-transfer') || policies.has('erc20-approve') || policies.has('spending-limit');
  if (!token && needsToken && (command === 'setup' || command === 'transact')) {
    throw new UsageError(`--token or TEST_TOKEN is required on chain ${chainId} for the token policies and allowance`);
  }

  const allowanceModuleDefault = defaults?.allowanceModule;
  const allowanceModule = values['allowance-module']
    ? requireAddress(values['allowance-module'], '--allowance-module')
    : allowanceModuleDefault;
  if (!allowanceModule) throw new UsageError(`--allowance-module is required on chain ${chainId}`);

  const allowanceResetMinutes = Number(parseBigInt(values['allowance-reset-minutes'] ?? '1440', '--allowance-reset-minutes'));
  if (allowanceResetMinutes > 0xffff) throw new UsageError('--allowance-reset-minutes must fit in uint16 (max 65535)');

  const threshold = parseBigInt(values.threshold ?? '1', '--threshold', 1n);
  // The default owners derive the default Safe's address, so CO_OWNER is needed only without --safe.
  const owners = values.owners
    ? parseAddressList(values.owners, '--owners')
    : values.safe
      ? [account.address]
      : [account.address, coOwner()];
  // Allowlists and the transfer recipient matter only to the commands that use them.
  const sendsTransactions = command === 'setup' || command === 'transact';
  if (new Set(owners).size !== owners.length) throw new UsageError('--owners: an owner is listed twice');
  if (threshold > BigInt(owners.length)) throw new UsageError('--threshold exceeds the number of owners');

  const override = (flag: keyof typeof values, fallback: Address): Address => {
    const value = values[flag];
    return typeof value === 'string' ? requireAddress(value, `--${flag}`) : fallback;
  };

  return {
    command,
    rpcUrl,
    // A custom --rpc-url is trusted for logs too; the public defaults split reads from archive logs.
    logsRpcUrl: values['logs-rpc-url'] ?? envString('LOGS_RPC_URL') ?? rpcUrl,
    chainId,
    chain: defineChain({
      id: chainId,
      name: defaults?.name ?? `Chain ${chainId}`,
      nativeCurrency: { name: defaults?.nativeSymbol ?? 'ETH', symbol: defaults?.nativeSymbol ?? 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    }),
    nativeSymbol: defaults?.nativeSymbol ?? 'ETH',
    explorer: defaults?.explorer,
    account,
    safe: values.safe ? requireAddress(values.safe, '--safe') : undefined,
    saltNonce: parseBigInt(values['salt-nonce'] ?? String(DEFAULT_SALT_NONCE), '--salt-nonce'),
    owners,
    threshold,
    guard,
    token,
    recipients: values.recipients
      ? parseAllowlist(values.recipients, '--recipients')
      : sendsTransactions
        ? parseAllowlist(`${coOwner()},${account.address},${trustedAddress()}:once`, '--recipients')
        : [],
    spenders: values.spenders
      ? parseAllowlist(values.spenders, '--spenders')
      : sendsTransactions
        ? parseAllowlist(`${coOwner()},${trustedAddress()}:once`, '--spenders')
        : [],
    delegate: values.delegate ? requireAddress(values.delegate, '--delegate') : account.address,
    ethAllowance: parseDecimal(values['eth-allowance'] ?? '0.001', '--eth-allowance'),
    tokenAllowance: parseDecimal(values['token-allowance'] ?? '100', '--token-allowance'),
    allowanceResetMinutes,
    policies,
    fundEth: parseDecimal(values['fund-eth'] ?? '0.001', '--fund-eth'),
    fundToken: parseDecimal(values['fund-token'] ?? '100', '--fund-token'),
    transferTo: values['transfer-to']
      ? requireAddress(values['transfer-to'], '--transfer-to')
      : sendsTransactions
        ? coOwner()
        : account.address,
    transferEth: parseDecimal(values['transfer-eth'] ?? '0.00001', '--transfer-eth'),
    transferToken: parseDecimal(values['transfer-token'] ?? '1', '--transfer-token'),
    skipTransactions: values['skip-transactions'] ?? false,
    keepSpendingLimits: values['keep-spending-limits'] ?? false,
    fromBlock: parseBigInt(values['from-block'] ?? '0', '--from-block'),
    dryRun: values['dry-run'] ?? false,
    contracts: {
      allowPolicy: override('allow-policy', POLICY_CONTRACTS.allow),
      nativeTransferPolicy: override('native-transfer-policy', POLICY_CONTRACTS.nativeTransfer),
      erc20TransferPolicy: override('erc20-transfer-policy', POLICY_CONTRACTS.erc20Transfer),
      erc20ApprovePolicy: override('erc20-approve-policy', POLICY_CONTRACTS.erc20Approve),
      multiSendPolicy: override('multisend-policy', POLICY_CONTRACTS.multiSend),
      allowanceModule,
      multiSendCallOnly: override('multisend-call-only', SAFE_V150.multiSendCallOnly),
      multiSend: override('multisend', SAFE_V150.multiSend),
      safeSingleton: override('safe-singleton', SAFE_V150.singletonL2),
      proxyFactory: override('proxy-factory', SAFE_V150.proxyFactory),
      fallbackHandler: override('fallback-handler', SAFE_V150.fallbackHandler),
    },
  };
}

// ─── Output ───────────────────────────────────────────────────────────────────────────────────────

const short = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;

const policyName = (contracts: Contracts, policy: Address): string => {
  const known: Array<[Address, string]> = [
    [contracts.allowPolicy, 'AllowPolicy'],
    [contracts.nativeTransferPolicy, 'NativeTransferPolicy'],
    [contracts.erc20TransferPolicy, 'ERC20TransferPolicy'],
    [contracts.erc20ApprovePolicy, 'ERC20ApprovePolicy'],
    [contracts.multiSendPolicy, 'MultiSendPolicy'],
  ];
  return (
    known.find(([address]) => isAddressEqual(address, policy))?.[1] ??
    policyContractName(policy) ??
    `unknown policy ${policy}`
  );
};

const describeAccess = ({ target, selector, operation }: Pick<Configuration, 'target' | 'selector' | 'operation'>) => {
  const fn = selector === NO_SELECTOR ? 'native transfer' : (SELECTOR_NAMES[selector] ?? selector);
  return `${fn} on ${target}${operation === DELEGATECALL ? ' (DELEGATECALL)' : ''}`;
};

const txLink = (ctx: Context, hash: Hex): string =>
  ctx.options.explorer ? `${ctx.options.explorer}/tx/${hash}` : hash;

// ─── Chain helpers ────────────────────────────────────────────────────────────────────────────────

/** The block-tag parameter position of each state read, so `latest` can be replaced by a concrete block. */
const BLOCK_TAG_POSITION: Record<string, number> = {
  eth_call: 1,
  eth_estimateGas: 1,
  eth_getCode: 1,
  eth_getBalance: 1,
  eth_getStorageAt: 2,
  eth_getBlockByNumber: 0,
};

const UNKNOWN_BLOCK = /header not found|unknown block|block not found|missing trie node|not available|historical state/i;

/**
 * Public RPCs are load-balanced across nodes at different heights, so a read right after a transaction
 * can be served from a node that has not seen it, and a simulation can disagree with the block it will
 * be mined after. This transport pins every `latest` read to a concrete block no older than
 * `sync.minBlock` (a node without that block errors rather than answering stale, and is retried), and
 * never hands out a nonce below one this run already used.
 */
function consistentTransport(url: string, sync: SyncState): Transport {
  const upstream = http(url, { retryCount: 6, retryDelay: 750 });
  return (config) => {
    const { request } = upstream(config);
    return custom({
      async request({ method, params }: { method: string; params?: unknown[] }) {
        const args = [...(params ?? [])];
        const position = BLOCK_TAG_POSITION[method];
        const pins = position !== undefined && (args[position] === undefined || args[position] === 'latest');
        for (let attempt = 0; ; attempt++) {
          if (pins) {
            let head = BigInt((await request({ method: 'eth_blockNumber' })) as Hex);
            while (head < sync.minBlock) {
              await sleep(1500);
              head = BigInt((await request({ method: 'eth_blockNumber' })) as Hex);
            }
            args[position] = `0x${head.toString(16)}`;
          }
          try {
            const result = await request({ method, params: args });
            if (method === 'eth_getTransactionCount' && args[1] === 'pending') {
              return `0x${Math.max(Number(BigInt(result as Hex)), sync.nextNonce).toString(16)}`;
            }
            if (method === 'eth_sendRawTransaction') {
              const { nonce } = parseTransaction(args[0] as Hex);
              if (nonce !== undefined) sync.nextNonce = Math.max(sync.nextNonce, nonce + 1);
            }
            return result;
          } catch (error) {
            const message = error instanceof BaseError ? `${error.shortMessage} ${error.details}` : String(error);
            if (pins && attempt < 20 && UNKNOWN_BLOCK.test(message)) {
              await sleep(1500);
              continue;
            }
            throw error;
          }
        }
      },
    })(config);
  };
}

async function assertHasCode(ctx: Context, entries: Array<[string, Address]>): Promise<void> {
  const missing: string[] = [];
  for (const [name, address] of entries) {
    const code = await ctx.publicClient.getCode({ address });
    if (!code || code === '0x') missing.push(`${name} ${address}`);
  }
  if (missing.length > 0) {
    throw new Error(`No contract on chain ${ctx.options.chainId} at:\n  ${missing.join('\n  ')}`);
  }
}

async function waitForReceipt(ctx: Context, hash: Hex, label: string): Promise<void> {
  console.log(`    sent ${txLink(ctx, hash)}`);
  const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash, timeout: 300_000 });
  if (receipt.blockNumber > ctx.sync.minBlock) ctx.sync.minBlock = receipt.blockNumber;
  if (receipt.status !== 'success') throw new Error(`${label} reverted in block ${receipt.blockNumber}`);
  console.log(`    ✓ ${label} (block ${receipt.blockNumber})`);
}

type SafeState = {
  address: Address;
  deployed: boolean;
  owners: Address[];
  threshold: bigint;
  nonce: bigint;
  version: string;
  guard: Address;
  moduleGuard: Address;
  modules: Address[];
};

async function readSafe(ctx: Context, address: Address): Promise<SafeState> {
  const code = await ctx.publicClient.getCode({ address });
  if (!code || code === '0x') {
    return {
      address,
      deployed: false,
      owners: [],
      threshold: 0n,
      nonce: 0n,
      version: '',
      guard: zeroAddress,
      moduleGuard: zeroAddress,
      modules: [],
    };
  }
  const contract = { address, abi: SAFE_ABI } as const;
  const readSlot = async (slot: bigint): Promise<Address> => {
    const word = await ctx.publicClient.readContract({ ...contract, functionName: 'getStorageAt', args: [slot, 1n] });
    return getAddress(`0x${word.slice(-40)}`);
  };
  const [owners, threshold, nonce, version, guard, moduleGuard, [modules]] = await Promise.all([
    ctx.publicClient.readContract({ ...contract, functionName: 'getOwners' }),
    ctx.publicClient.readContract({ ...contract, functionName: 'getThreshold' }),
    ctx.publicClient.readContract({ ...contract, functionName: 'nonce' }),
    ctx.publicClient.readContract({ ...contract, functionName: 'VERSION' }),
    readSlot(BigInt(TRANSACTION_GUARD_STORAGE_SLOT)),
    readSlot(BigInt(MODULE_GUARD_STORAGE_SLOT)),
    ctx.publicClient.readContract({ ...contract, functionName: 'getModulesPaginated', args: [SENTINEL_ADDRESS, 100n] }),
  ]);
  return {
    address,
    deployed: true,
    owners: [...owners],
    threshold,
    nonce,
    version,
    guard,
    moduleGuard,
    modules: [...modules],
  };
}

/** The Safe's proxy address for the given setup: what `createProxyWithNonce` deploys. */
async function predictSafe(ctx: Context): Promise<{ address: Address; initializer: Hex }> {
  const { owners, threshold, saltNonce, contracts } = ctx.options;
  const initializer = encodeFunctionData({
    abi: SAFE_ABI,
    functionName: 'setup',
    args: [owners, threshold, zeroAddress, '0x', contracts.fallbackHandler, zeroAddress, 0n, zeroAddress],
  });
  const creationCode = await ctx.publicClient.readContract({
    address: contracts.proxyFactory,
    abi: PROXY_FACTORY_ABI,
    functionName: 'proxyCreationCode',
  });
  const address = getContractAddress({
    opcode: 'CREATE2',
    from: contracts.proxyFactory,
    salt: keccak256(encodePacked(['bytes32', 'uint256'], [keccak256(initializer), saltNonce])),
    bytecode: concat([creationCode, pad(contracts.safeSingleton, { size: 32 })]),
  });
  return { address, initializer };
}

async function resolveSafe(ctx: Context): Promise<Address> {
  if (ctx.options.safe) return ctx.options.safe;
  return (await predictSafe(ctx)).address;
}

function assertCanExecute(ctx: Context, safe: SafeState): void {
  const signer = ctx.options.account.address;
  if (!safe.owners.some((owner) => isAddressEqual(owner, signer))) {
    throw new Error(`The signer ${signer} is not an owner of ${safe.address}`);
  }
  if (safe.threshold !== 1n) {
    throw new Error(`${safe.address} has threshold ${safe.threshold}; this script executes alone and needs threshold 1`);
  }
}

/**
 * Executes one Safe transaction, signed by the signer alone. Always simulated first, so a policy
 * rejection surfaces as its decoded cause; `--dry-run` stops after the simulation.
 */
async function execSafeTransaction(
  ctx: Context,
  safe: Address,
  tx: MetaTransaction,
  label: string,
): Promise<'simulated' | 'executed'> {
  const { account, dryRun } = ctx.options;
  const args = [
    tx.to,
    tx.value,
    tx.data,
    tx.operation,
    0n, // safeTxGas: the guard requires 0, so a failing call reverts the whole transaction.
    0n,
    0n, // gasPrice: the guard requires 0 (no refunds).
    zeroAddress,
    zeroAddress,
    preValidatedSignature(account.address),
  ] as const;

  console.log(`  → ${label}`);
  const { request } = await ctx.publicClient
    .simulateContract({ account, address: safe, abi: SAFE_ABI, functionName: 'execTransaction', args })
    .catch((error: unknown) => {
      throw new Error(`${label}: simulation failed: ${describeError(error)}`);
    });
  if (dryRun) {
    console.log('    ✓ simulation passed (dry run: not sent)');
    return 'simulated';
  }
  const hash = await ctx.walletClient.writeContract(request);
  await waitForReceipt(ctx, hash, label);
  return 'executed';
}

/** Simulation only: whether the Safe would accept the transaction right now. */
async function simulateSafeTransaction(ctx: Context, safe: Address, tx: MetaTransaction): Promise<string | undefined> {
  try {
    await ctx.publicClient.simulateContract({
      account: ctx.options.account,
      address: safe,
      abi: SAFE_ABI,
      functionName: 'execTransaction',
      args: [tx.to, tx.value, tx.data, tx.operation, 0n, 0n, 0n, zeroAddress, zeroAddress, preValidatedSignature(ctx.options.account.address)],
    });
    return undefined;
  } catch (error) {
    return describeError(error);
  }
}

// ─── Policy state from the chain ──────────────────────────────────────────────────────────────────

type Binding = Configuration & { guard: Address };

type GuardState = {
  guard: Address;
  bindings: Binding[];
  /** Requested roots still stored on the guard, whether matured, pending or expired. */
  pendingRoots: Array<{ root: Hex; validFrom: bigint }>;
};

/** `eth_getLogs` over a block range, split up whenever the RPC caps the range it serves. */
async function getLogsChunked<T>(
  ctx: Context,
  fetch: (fromBlock: bigint, toBlock: bigint) => Promise<T[]>,
): Promise<T[]> {
  const latest = await ctx.logsClient.getBlockNumber();
  const results: T[] = [];
  let from = ctx.options.fromBlock;
  let span = latest - from + 1n;
  while (from <= latest) {
    const to = from + span - 1n > latest ? latest : from + span - 1n;
    try {
      results.push(...(await fetch(from, to)));
      from = to + 1n;
    } catch (error) {
      const message = describeError(error) + (error instanceof BaseError ? ` ${error.details ?? ''}` : '');
      if (/pruned|history|archive/i.test(message)) {
        throw new Error(
          `The logs RPC has no history from block ${from}. Use an archive node (--logs-rpc-url) or a later --from-block.\n  ${message}`,
        );
      }
      const cap = /(?:range|limit)[^\d]*(\d{2,})/i.exec(message);
      const next = cap ? BigInt(cap[1]) : span / 2n;
      if (next < 1n || next >= span) throw error;
      span = next;
    }
  }
  return results;
}

async function readGuardState(ctx: Context, guard: Address, safe: Address): Promise<GuardState> {
  const confirmed = await getLogsChunked(ctx, (fromBlock, toBlock) =>
    ctx.logsClient.getLogs({ address: guard, event: POLICY_CONFIRMED_EVENT, args: { safe }, fromBlock, toBlock }),
  );
  // Later confirmations of an access replace earlier ones; a zero policy removes the binding.
  const ordered = [...confirmed].sort((a, b) =>
    a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1,
  );
  const byAccess = new Map<string, Binding>();
  for (const { args } of ordered) {
    const { target, selector, operation, policy, data } = args;
    if (!target || !selector || operation === undefined || !policy || data === undefined) continue;
    byAccess.set(`${target.toLowerCase()}:${selector}:${operation}`, {
      guard,
      target: getAddress(target),
      selector,
      operation: operation === DELEGATECALL ? DELEGATECALL : CALL,
      policy: getAddress(policy),
      data,
    });
  }
  // Logs only nominate candidates: a log endpoint can lag the chain, so the guard's own lookup decides
  // what is live. `getPolicy` falls back to the operation's fallback key when the access is unbound.
  const bindings: Binding[] = [];
  for (const binding of byAccess.values()) {
    if (isAddressEqual(binding.policy, zeroAddress)) continue;
    const [access, policy] = await ctx.publicClient.readContract({
      address: guard,
      abi: GUARD_ABI,
      functionName: 'getPolicy',
      args: [safe, binding.target, binding.selector === NO_SELECTOR ? '0x' : binding.selector, binding.operation],
    });
    if (access === packAccess(binding) && !isAddressEqual(policy, zeroAddress)) bindings.push({ ...binding, policy: getAddress(policy) });
  }

  const requested = await getLogsChunked(ctx, (fromBlock, toBlock) =>
    ctx.logsClient.getLogs({ address: guard, event: ROOT_CONFIGURED_EVENT, args: { safe }, fromBlock, toBlock }),
  );
  const roots = [...new Set(requested.flatMap(({ args }) => (args.root ? [args.root] : [])))];
  const pendingRoots: GuardState['pendingRoots'] = [];
  for (const root of roots) {
    const validFrom = await ctx.publicClient.readContract({
      address: guard,
      abi: GUARD_ABI,
      functionName: 'rootConfigured',
      args: [safe, root],
    });
    if (validFrom !== 0n) pendingRoots.push({ root, validFrom });
  }
  return { guard, bindings, pendingRoots };
}

/** Every known guard (plus the Safe's own and --guard) the Safe has bindings or requests on. */
async function readAllGuardStates(ctx: Context, safe: SafeState): Promise<GuardState[]> {
  const candidates = new Map<string, Address>();
  for (const guard of [
    safe.guard,
    safe.moduleGuard,
    ctx.options.guard,
    ...Object.values(INDEXED_GUARDS),
    ...Object.values(LEGACY_GUARDS),
  ]) {
    if (!isAddressEqual(guard, zeroAddress)) candidates.set(guard.toLowerCase(), guard);
  }
  const states: GuardState[] = [];
  for (const guard of candidates.values()) {
    const code = await ctx.publicClient.getCode({ address: guard });
    if (!code || code === '0x') continue;
    const state = await readGuardState(ctx, guard, safe.address);
    if (state.bindings.length > 0 || state.pendingRoots.length > 0) states.push(state);
  }
  return states;
}

type SpendingLimit = { delegate: Address; token: Address; amount: bigint; spent: bigint; resetMinutes: bigint };

async function readSpendingLimits(ctx: Context, safe: Address): Promise<{ delegates: Address[]; limits: SpendingLimit[] }> {
  const module = ctx.options.contracts.allowanceModule;
  const delegates: Address[] = [];
  let start = 0;
  do {
    const [page, next] = await ctx.publicClient.readContract({
      address: module,
      abi: ALLOWANCE_MODULE_ABI,
      functionName: 'getDelegates',
      args: [safe, start, 50],
    });
    delegates.push(...page);
    start = next;
  } while (start !== 0);

  const limits: SpendingLimit[] = [];
  for (const delegate of delegates) {
    const tokens = await ctx.publicClient.readContract({
      address: module,
      abi: ALLOWANCE_MODULE_ABI,
      functionName: 'getTokens',
      args: [safe, delegate],
    });
    for (const token of tokens) {
      const [amount, spent, resetMinutes] = await ctx.publicClient.readContract({
        address: module,
        abi: ALLOWANCE_MODULE_ABI,
        functionName: 'getTokenAllowance',
        args: [safe, delegate, token],
      });
      limits.push({ delegate, token, amount, spent, resetMinutes });
    }
  }
  return { delegates, limits };
}

type TokenInfo = { address: Address; symbol: string; decimals: number };

async function readToken(ctx: Context, address: Address): Promise<TokenInfo> {
  const [symbol, decimals] = await Promise.all([
    ctx.publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }),
    ctx.publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
  ]);
  return { address, symbol, decimals };
}

// ─── Policy plan ──────────────────────────────────────────────────────────────────────────────────

/** The guard bindings `setup` configures, from the selected policies. */
function buildConfigurations(options: Options, safe: Address): Configuration[] {
  const { policies, contracts, token, recipients, spenders } = options;
  const configurations: Configuration[] = [];

  if (policies.has('native-transfer')) {
    // Keyed by the recipient itself: a plain ETH transfer is a CALL to it with no calldata.
    for (const { address } of recipients) {
      configurations.push({
        target: address,
        selector: NO_SELECTOR,
        operation: CALL,
        policy: contracts.nativeTransferPolicy,
        data: '0x',
      });
    }
  }
  if (policies.has('erc20-transfer') && token) {
    const data = encodeAllowlist(recipients);
    for (const selector of [SELECTORS.transfer, SELECTORS.transferFrom]) {
      configurations.push({ target: token, selector, operation: CALL, policy: contracts.erc20TransferPolicy, data });
    }
  }
  if (policies.has('erc20-approve') && token) {
    configurations.push({
      target: token,
      selector: SELECTORS.approve,
      operation: CALL,
      policy: contracts.erc20ApprovePolicy,
      data: encodeAllowlist(spenders),
    });
  }
  if (policies.has('owner-management')) {
    for (const selector of [SELECTORS.addOwnerWithThreshold, SELECTORS.removeOwner, SELECTORS.swapOwner, SELECTORS.changeThreshold]) {
      configurations.push({ target: safe, selector, operation: CALL, policy: contracts.allowPolicy, data: '0x' });
    }
  }
  if (policies.has('enable-module')) {
    configurations.push({ target: safe, selector: SELECTORS.enableModule, operation: CALL, policy: contracts.allowPolicy, data: '0x' });
  }
  if (policies.has('multisend')) {
    // MultiSendPolicy only accepts a DELEGATECALL binding on `multiSend`, which is what a Safe batch is.
    for (const target of [contracts.multiSendCallOnly, contracts.multiSend]) {
      configurations.push({ target, selector: SELECTORS.multiSend, operation: DELEGATECALL, policy: contracts.multiSendPolicy, data: '0x' });
    }
  }
  return configurations;
}

// ─── Commands ─────────────────────────────────────────────────────────────────────────────────────

async function printSafeHeader(ctx: Context, safe: SafeState): Promise<void> {
  console.log(`Safe ${safe.address} on ${ctx.options.chain.name} (${ctx.options.chainId})`);
  if (!safe.deployed) {
    console.log('  not deployed');
    return;
  }
  console.log(`  version ${safe.version}, nonce ${safe.nonce}, threshold ${safe.threshold} of ${safe.owners.length}`);
  console.log(`  owners  ${safe.owners.join(', ')}`);
  const guardLine = (address: Address) => (isAddressEqual(address, zeroAddress) ? 'none' : `${address} (${guardName(address)})`);
  console.log(`  transaction guard ${guardLine(safe.guard)}`);
  console.log(`  module guard      ${guardLine(safe.moduleGuard)}`);
  console.log(`  modules ${safe.modules.length === 0 ? 'none' : safe.modules.join(', ')}`);
  const eth = await ctx.publicClient.getBalance({ address: safe.address });
  let balances = `${formatEther(eth)} ${ctx.options.nativeSymbol}`;
  if (ctx.options.token) {
    const token = await readToken(ctx, ctx.options.token);
    const held = await ctx.publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [safe.address] });
    balances += `, ${formatUnits(held, token.decimals)} ${token.symbol}`;
  }
  console.log(`  balance ${balances}`);
}

async function status(ctx: Context): Promise<void> {
  const safe = await readSafe(ctx, await resolveSafe(ctx));
  await printSafeHeader(ctx, safe);
  if (!safe.deployed) return;

  const { allowanceModule } = ctx.options.contracts;
  if (safe.modules.some((module) => isAddressEqual(module, allowanceModule))) {
    const { delegates, limits } = await readSpendingLimits(ctx, safe.address);
    console.log(`\nSpending limits (AllowanceModule ${short(allowanceModule)}): ${delegates.length} delegate(s)`);
    for (const limit of limits) {
      const token = isAddressEqual(limit.token, NATIVE_TOKEN)
        ? { symbol: ctx.options.nativeSymbol, decimals: 18 }
        : await readToken(ctx, limit.token);
      console.log(
        `  ${limit.delegate}: ${formatUnits(limit.spent, token.decimals)} / ${formatUnits(limit.amount, token.decimals)} ${token.symbol}` +
          `${limit.resetMinutes > 0n ? ` every ${limit.resetMinutes} min` : ' (one-off)'}`,
      );
    }
  }

  console.log('\nPolicy bindings (reading guard events…)');
  const states = await readAllGuardStates(ctx, safe);
  if (states.length === 0) console.log('  none on any known guard');
  for (const state of states) {
    console.log(`  ${state.guard} (${guardName(state.guard)}): ${state.bindings.length} binding(s)`);
    for (const binding of state.bindings) {
      console.log(`    ${policyName(ctx.options.contracts, binding.policy).padEnd(22)} ${describeAccess(binding)}`);
    }
    const now = (await ctx.publicClient.getBlock()).timestamp;
    for (const { root, validFrom } of state.pendingRoots) {
      const when = validFrom > now ? `matures in ${validFrom - now}s` : 'matured';
      console.log(`    pending request ${root} (${when})`);
    }
  }
}

async function topUp(ctx: Context, safe: Address, token: TokenInfo | undefined): Promise<void> {
  const { account, dryRun, fundEth, fundToken } = ctx.options;
  const ethTarget = parseEther(fundEth);
  const ethBalance = await ctx.publicClient.getBalance({ address: safe });
  if (ethBalance < ethTarget) {
    const amount = ethTarget - ethBalance;
    console.log(`  → fund ${formatEther(amount)} ${ctx.options.nativeSymbol} from ${short(account.address)}`);
    if (dryRun) console.log('    (dry run: not sent)');
    else {
      const hash = await ctx.walletClient.sendTransaction({ account, chain: ctx.options.chain, to: safe, value: amount });
      await waitForReceipt(ctx, hash, `${ctx.options.nativeSymbol} funded`);
    }
  }
  if (token) {
    const target = parseUnits(fundToken, token.decimals);
    const balance = await ctx.publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [safe] });
    if (balance < target) {
      const amount = target - balance;
      console.log(`  → fund ${formatUnits(amount, token.decimals)} ${token.symbol} from ${short(account.address)}`);
      if (dryRun) console.log('    (dry run: not sent)');
      else {
        const hash = await ctx.walletClient.writeContract({
          account,
          chain: ctx.options.chain,
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [safe, amount],
        });
        await waitForReceipt(ctx, hash, `${token.symbol} funded`);
      }
    }
  }
}

async function setup(ctx: Context): Promise<void> {
  const { options } = ctx;
  const { contracts, guard, policies } = options;
  const usesToken = !!options.token && (policies.has('erc20-transfer') || policies.has('erc20-approve') || policies.has('spending-limit'));

  const required: Array<[string, Address]> = [
    ['SafePolicyGuard', guard],
    ['Safe singleton', contracts.safeSingleton],
    ['SafeProxyFactory', contracts.proxyFactory],
    ['MultiSendCallOnly', contracts.multiSendCallOnly],
  ];
  if (policies.has('native-transfer')) required.push(['NativeTransferPolicy', contracts.nativeTransferPolicy]);
  if (policies.has('erc20-transfer')) required.push(['ERC20TransferPolicy', contracts.erc20TransferPolicy]);
  if (policies.has('erc20-approve')) required.push(['ERC20ApprovePolicy', contracts.erc20ApprovePolicy]);
  if (policies.has('owner-management') || policies.has('enable-module')) required.push(['AllowPolicy', contracts.allowPolicy]);
  if (policies.has('multisend')) required.push(['MultiSendPolicy', contracts.multiSendPolicy], ['MultiSend', contracts.multiSend]);
  if (policies.has('spending-limit')) required.push(['AllowanceModule', contracts.allowanceModule]);
  if (usesToken && options.token) required.push(['token', options.token]);
  await assertHasCode(ctx, required);
  const delay = await ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'DELAY' });
  const token = usesToken && options.token ? await readToken(ctx, options.token) : undefined;

  // 1. The Safe itself.
  let safeAddress = options.safe;
  if (!safeAddress) {
    const { address, initializer } = await predictSafe(ctx);
    safeAddress = address;
    const existing = await ctx.publicClient.getCode({ address });
    console.log(`Safe ${address} (salt nonce ${options.saltNonce})`);
    if (!existing || existing === '0x') {
      if (!options.owners.some((owner) => isAddressEqual(owner, options.account.address)) || options.threshold !== 1n) {
        throw new Error('A Safe deployed by setup must have the signer as an owner and threshold 1');
      }
      console.log(`  → deploy: owners ${options.owners.join(', ')}, threshold ${options.threshold}`);
      if (options.dryRun) {
        console.log('    (dry run: not sent; nothing after it can be simulated)');
      } else {
        const hash = await ctx.walletClient.writeContract({
          account: options.account,
          chain: options.chain,
          address: contracts.proxyFactory,
          abi: PROXY_FACTORY_ABI,
          functionName: 'createProxyWithNonce',
          args: [contracts.safeSingleton, initializer, options.saltNonce],
        });
        await waitForReceipt(ctx, hash, 'Safe deployed');
      }
    }
  }
  const safe = await readSafe(ctx, safeAddress);
  if (options.safe && !safe.deployed) throw new Error(`${options.safe} is not deployed; omit --safe to deploy one by salt nonce`);
  if (safe.deployed) {
    assertCanExecute(ctx, safe);
    for (const [slot, current] of [['transaction', safe.guard], ['module', safe.moduleGuard]] as const) {
      if (!isAddressEqual(current, zeroAddress)) {
        throw new Error(
          `${safe.address} already has a ${slot} guard (${current}, ${guardName(current)}). ` +
            'configureImmediately only works on a Safe without the guard: run teardown first.',
        );
      }
    }
  }

  // 2. Funds for the test transactions.
  console.log('\nFunding');
  await topUp(ctx, safeAddress, token);

  // 3. One batch: spending limit, policy bindings, guards.
  const configurations = buildConfigurations(options, safeAddress);
  const batch: MetaTransaction[] = [];
  const steps: string[] = [];
  if (policies.has('spending-limit')) {
    if (!safe.modules.some((module) => isAddressEqual(module, contracts.allowanceModule))) {
      batch.push({
        to: safeAddress,
        value: 0n,
        data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'enableModule', args: [contracts.allowanceModule] }),
        operation: CALL,
      });
      steps.push(`enable AllowanceModule ${contracts.allowanceModule}`);
    }
    const moduleCall = (data: Hex): MetaTransaction => ({ to: contracts.allowanceModule, value: 0n, data, operation: CALL });
    const resetMinutes = options.allowanceResetMinutes;
    const period = resetMinutes > 0 ? `every ${resetMinutes} min` : 'one-off';
    const setAllowance = (asset: Address, amount: bigint) =>
      moduleCall(
        encodeFunctionData({
          abi: ALLOWANCE_MODULE_ABI,
          functionName: 'setAllowance',
          args: [options.delegate, asset, amount, resetMinutes, 0],
        }),
      );
    batch.push(moduleCall(encodeFunctionData({ abi: ALLOWANCE_MODULE_ABI, functionName: 'addDelegate', args: [options.delegate] })));
    steps.push(`add spending limit delegate ${options.delegate}`);
    batch.push(setAllowance(NATIVE_TOKEN, parseEther(options.ethAllowance)));
    steps.push(`spending limit ${options.ethAllowance} ${options.nativeSymbol} ${period}`);
    if (token) {
      batch.push(setAllowance(token.address, parseUnits(options.tokenAllowance, token.decimals)));
      steps.push(`spending limit ${options.tokenAllowance} ${token.symbol} ${period}`);
    }
  }
  if (configurations.length > 0) {
    batch.push({
      to: guard,
      value: 0n,
      data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'configureImmediately', args: [configurations] }),
      operation: CALL,
    });
    steps.push(`configure ${configurations.length} policy binding(s) on ${guard} (${guardName(guard)}, DELAY ${delay}s):`);
    for (const configuration of configurations) {
      const allowlist =
        configuration.policy === contracts.erc20TransferPolicy || configuration.policy === contracts.nativeTransferPolicy
          ? options.recipients
          : configuration.policy === contracts.erc20ApprovePolicy
            ? options.spenders
            : undefined;
      const detail =
        allowlist && configuration.policy !== contracts.nativeTransferPolicy
          ? ` → ${allowlist.map(({ address, permission }) => `${short(address)}${permission === 'once' ? ' (once)' : ''}`).join(', ')}`
          : '';
      steps.push(`    ${policyName(contracts, configuration.policy).padEnd(22)} ${describeAccess(configuration)}${detail}`);
    }
  }
  // Last: configureImmediately reverts once the guard is installed in either slot.
  batch.push(
    { to: safeAddress, value: 0n, data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'setGuard', args: [guard] }), operation: CALL },
    { to: safeAddress, value: 0n, data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'setModuleGuard', args: [guard] }), operation: CALL },
  );
  steps.push(`install ${short(guard)} as transaction guard`, `install ${short(guard)} as module guard`);

  console.log(`\nSetup batch (${batch.length} calls in one Safe transaction via MultiSendCallOnly)`);
  for (const step of steps) console.log(step.startsWith(' ') ? `  ${step}` : `  • ${step}`);

  if (!safe.deployed) {
    console.log('\nThe Safe is not deployed yet, so the batch cannot be simulated in a dry run.');
    return;
  }
  await execSafeTransaction(
    ctx,
    safeAddress,
    { to: contracts.multiSendCallOnly, value: 0n, data: encodeMultiSend(batch), operation: DELEGATECALL },
    'setup batch',
  );

  if (options.skipTransactions) return;
  if (options.dryRun) {
    console.log('\nThe test transactions depend on the setup batch, so a dry run does not simulate them.');
    return;
  }
  console.log('');
  await transact(ctx);
}

async function transact(ctx: Context): Promise<void> {
  const { options } = ctx;
  const { contracts, transferTo, account, policies, nativeSymbol } = options;
  const safe = await readSafe(ctx, await resolveSafe(ctx));
  if (!safe.deployed) throw new Error(`${safe.address} is not deployed`);
  assertCanExecute(ctx, safe);

  // Each transfer below spends the recipient's grant once, so a single-use grant would fail the second.
  const recipient = options.recipients.find(({ address }) => isAddressEqual(address, transferTo));
  if (!recipient) throw new Error(`--transfer-to ${transferTo} is not in --recipients, so every test transfer would be denied`);
  if (recipient.permission !== 'always') throw new Error(`--transfer-to ${transferTo} must be allowlisted "always", not "once"`);

  const token = options.token && policies.has('erc20-transfer') ? await readToken(ctx, options.token) : undefined;
  const testNative = policies.has('native-transfer');
  const ethAmount = parseEther(options.transferEth);
  const tokenAmount = token ? parseUnits(options.transferToken, token.decimals) : 0n;

  console.log(`Test transactions from ${safe.address} to ${transferTo}`);
  await topUp(ctx, safe.address, token);

  const nativeTransfer = (to: Address): MetaTransaction => ({ to, value: ethAmount, data: '0x', operation: CALL });
  const tokenTransfer = (to: Address, asset: TokenInfo): MetaTransaction => ({
    to: asset.address,
    value: 0n,
    data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [to, tokenAmount] }),
    operation: CALL,
  });

  if (token) await execSafeTransaction(ctx, safe.address, tokenTransfer(transferTo, token), `Safe transfer ${options.transferToken} ${token.symbol}`);
  if (testNative) await execSafeTransaction(ctx, safe.address, nativeTransfer(transferTo), `Safe transfer ${options.transferEth} ${nativeSymbol}`);

  // Through the spending limit: the module transaction is checked by the module guard, against the same
  // transfer policies, so each asset is only exercised when its transfer policy is configured.
  if (policies.has('spending-limit')) {
    const hasModule = safe.modules.some((module) => isAddressEqual(module, contracts.allowanceModule));
    if (!hasModule) {
      console.log('  • spending limit transfers skipped: the AllowanceModule is not enabled');
    } else if (!isAddressEqual(options.delegate, account.address)) {
      console.log(`  • spending limit transfers skipped: the delegate ${options.delegate} is not the signer`);
    } else {
      const allowanceTransfer = async (asset: Address, amount: bigint, label: string) => {
        console.log(`  → ${label}`);
        const { request } = await ctx.publicClient
          .simulateContract({
            account,
            address: contracts.allowanceModule,
            abi: [...ALLOWANCE_MODULE_ABI, ...GUARD_ERRORS_ABI],
            functionName: 'executeAllowanceTransfer',
            // An empty signature authorises the delegate as the sender.
            args: [safe.address, asset, transferTo, amount, zeroAddress, 0n, account.address, '0x'],
          })
          .catch((error: unknown) => {
            throw new Error(`${label}: simulation failed: ${describeError(error)}`);
          });
        if (options.dryRun) {
          console.log('    ✓ simulation passed (dry run: not sent)');
          return;
        }
        await waitForReceipt(ctx, await ctx.walletClient.writeContract(request), label);
      };
      if (token) await allowanceTransfer(token.address, tokenAmount, `spending limit transfer ${options.transferToken} ${token.symbol}`);
      if (testNative) await allowanceTransfer(NATIVE_TOKEN, ethAmount, `spending limit transfer ${options.transferEth} ${nativeSymbol}`);
    }
  }

  // The other side: the same transfers to an address outside the allowlist must be rejected.
  const outsider = getAddress(keccak256(concat([safe.address, '0x01'])).slice(0, 42));
  const probes: Array<[string, MetaTransaction]> = [];
  if (token) probes.push([token.symbol, tokenTransfer(outsider, token)]);
  if (testNative) probes.push([nativeSymbol, nativeTransfer(outsider)]);
  for (const [asset, probe] of probes) {
    const reason = await simulateSafeTransaction(ctx, safe.address, probe);
    if (reason) console.log(`  ✓ ${asset} transfer to non-allowlisted ${short(outsider)} is rejected: ${reason}`);
    else throw new Error(`${asset} transfer to non-allowlisted ${outsider} would be ACCEPTED: the policies are not enforced`);
  }
}

/** Waits until the chain's clock reaches `timestamp`. */
async function waitUntil(ctx: Context, timestamp: bigint, what: string): Promise<void> {
  for (;;) {
    const block = await ctx.publicClient.getBlock();
    const now = block.timestamp;
    if (now >= timestamp) {
      // Later simulations then run in a block that already satisfies the time check.
      if (block.number > ctx.sync.minBlock) ctx.sync.minBlock = block.number;
      return;
    }
    console.log(`    waiting ${timestamp - now}s for ${what}…`);
    await new Promise((resolve) => setTimeout(resolve, Number(timestamp - now > 12n ? 12n : timestamp - now) * 1000 + 1000));
  }
}

async function teardown(ctx: Context): Promise<void> {
  const { options } = ctx;
  const { contracts } = options;
  let safe = await readSafe(ctx, await resolveSafe(ctx));
  await printSafeHeader(ctx, safe);
  if (!safe.deployed) return;
  assertCanExecute(ctx, safe);

  console.log('\nReading policy state…');
  const guardStates = await readAllGuardStates(ctx, safe);
  for (const state of guardStates) {
    console.log(`  ${state.guard} (${guardName(state.guard)}): ${state.bindings.length} binding(s), ${state.pendingRoots.length} pending request(s)`);
  }

  // 1. The transaction guard checks every owner transaction, including the one that removes it.
  if (!isAddressEqual(safe.guard, zeroAddress)) {
    const guard = safe.guard;
    console.log(`\nRemoving the transaction guard ${guard}`);
    const removeGuard: MetaTransaction = {
      to: safe.address,
      value: 0n,
      data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'setGuard', args: [zeroAddress] }),
      operation: CALL,
    };
    const rejection = await simulateSafeTransaction(ctx, safe.address, removeGuard);
    if (rejection) {
      console.log(`  setGuard(0) is not permitted yet (${rejection}); requesting an AllowPolicy binding for it`);
      await assertHasCode(ctx, [['AllowPolicy', contracts.allowPolicy]]);
      const permitRemoval: Configuration[] = [
        { target: safe.address, selector: SELECTORS.setGuard, operation: CALL, policy: contracts.allowPolicy, data: '0x' },
      ];
      const root = configurationRoot(permitRemoval);
      const [delay, expiry] = await Promise.all([
        ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'DELAY' }),
        ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'EXPIRY' }),
      ]);
      let validFrom = await ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'rootConfigured', args: [safe.address, root] });
      const now = (await ctx.publicClient.getBlock()).timestamp;
      if (validFrom === 0n || now >= validFrom + expiry) {
        const sent = await execSafeTransaction(
          ctx,
          safe.address,
          { to: guard, value: 0n, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'requestConfiguration', args: [root] }), operation: CALL },
          `request configuration ${short(root)} (DELAY ${delay}s)`,
        );
        if (sent === 'simulated') {
          console.log(`\nDry run stops here: applying it needs the request on-chain and ${delay}s to pass, then setGuard(0) and the cleanup batch.`);
          return;
        }
        validFrom = await ctx.publicClient.readContract({ address: guard, abi: GUARD_ABI, functionName: 'rootConfigured', args: [safe.address, root] });
      } else {
        console.log(`  reusing the request already made for ${short(root)}`);
      }
      await waitUntil(ctx, validFrom, 'the guard delay');
      const applied = await execSafeTransaction(
        ctx,
        safe.address,
        { to: guard, value: 0n, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'applyConfiguration', args: [permitRemoval] }), operation: CALL },
        'apply configuration',
      );
      if (applied === 'simulated') return;
    }
    const removed = await execSafeTransaction(ctx, safe.address, removeGuard, 'setGuard(0)');
    if (removed === 'simulated') {
      console.log('\nDry run stops here: the cleanup batch depends on the guard being removed.');
      return;
    }
  }

  // 2. With no transaction guard nothing is checked: everything else goes in one batch.
  safe = await readSafe(ctx, safe.address);
  const refreshed = await readAllGuardStates(ctx, safe);
  const batch: MetaTransaction[] = [];
  const steps: string[] = [];
  if (!isAddressEqual(safe.moduleGuard, zeroAddress)) {
    batch.push({ to: safe.address, value: 0n, data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'setModuleGuard', args: [zeroAddress] }), operation: CALL });
    steps.push(`remove module guard ${safe.moduleGuard}`);
  }
  const moduleIndex = safe.modules.findIndex((module) => isAddressEqual(module, contracts.allowanceModule));
  if (moduleIndex >= 0 && !options.keepSpendingLimits) {
    const { delegates } = await readSpendingLimits(ctx, safe.address);
    for (const delegate of delegates) {
      batch.push({
        to: contracts.allowanceModule,
        value: 0n,
        data: encodeFunctionData({ abi: ALLOWANCE_MODULE_ABI, functionName: 'removeDelegate', args: [delegate, true] }),
        operation: CALL,
      });
      steps.push(`remove spending limit delegate ${delegate} and its allowances`);
    }
    const previous = moduleIndex === 0 ? SENTINEL_ADDRESS : safe.modules[moduleIndex - 1];
    batch.push({
      to: safe.address,
      value: 0n,
      data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'disableModule', args: [previous, contracts.allowanceModule] }),
      operation: CALL,
    });
    steps.push(`disable AllowanceModule ${contracts.allowanceModule}`);
  }
  for (const state of refreshed) {
    for (const { root } of state.pendingRoots) {
      batch.push({ to: state.guard, value: 0n, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'invalidateRoot', args: [root] }), operation: CALL });
      steps.push(`invalidate pending request ${short(root)} on ${short(state.guard)}`);
    }
    if (state.bindings.length > 0) {
      // A zero policy deletes the binding; configureImmediately is open again once neither slot holds the guard.
      const clear = state.bindings.map(({ target, selector, operation }) => ({ target, selector, operation, policy: zeroAddress, data: '0x' as Hex }));
      batch.push({ to: state.guard, value: 0n, data: encodeFunctionData({ abi: GUARD_ABI, functionName: 'configureImmediately', args: [clear] }), operation: CALL });
      steps.push(`clear ${clear.length} binding(s) on ${short(state.guard)} (${guardName(state.guard)})`);
    }
  }

  if (batch.length === 0) {
    console.log('\nNothing left to remove.');
  } else {
    console.log(`\nCleanup batch (${batch.length} calls in one Safe transaction via MultiSendCallOnly)`);
    for (const step of steps) console.log(step.startsWith(' ') ? `  ${step}` : `  • ${step}`);
    await execSafeTransaction(
      ctx,
      safe.address,
      { to: contracts.multiSendCallOnly, value: 0n, data: encodeMultiSend(batch), operation: DELEGATECALL },
      'cleanup batch',
    );
  }
  if (options.dryRun) return;

  // 3. Verify from the chain, not from what was sent.
  safe = await readSafe(ctx, safe.address);
  const remaining = await readAllGuardStates(ctx, safe);
  const leftovers = [
    ...(isAddressEqual(safe.guard, zeroAddress) ? [] : [`transaction guard ${safe.guard}`]),
    ...(isAddressEqual(safe.moduleGuard, zeroAddress) ? [] : [`module guard ${safe.moduleGuard}`]),
    ...remaining.flatMap((state) => [
      ...state.bindings.map((binding) => `binding ${describeAccess(binding)} on ${short(state.guard)}`),
      ...state.pendingRoots.map(({ root }) => `pending request ${short(root)} on ${short(state.guard)}`),
    ]),
    ...(!options.keepSpendingLimits && safe.modules.some((module) => isAddressEqual(module, contracts.allowanceModule))
      ? ['AllowanceModule still enabled']
      : []),
  ];
  if (leftovers.length > 0) throw new Error(`Teardown incomplete:\n  ${leftovers.join('\n  ')}`);
  console.log(`\n✓ ${safe.address} has no guard, no policy binding and no pending request left`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = await parseOptions();
  if (!options) return;

  const sync: SyncState = { minBlock: 0n, nextNonce: 0 };
  const transport = consistentTransport(options.rpcUrl, sync);
  const ctx: Context = {
    options,
    sync,
    publicClient: createPublicClient({ chain: options.chain, transport, cacheTime: 0 }),
    logsClient: createPublicClient({ chain: options.chain, transport: http(options.logsRpcUrl, { retryCount: 6, retryDelay: 750 }) }),
    walletClient: createWalletClient({ account: options.account, chain: options.chain, transport }),
  };

  console.log(`Signer ${options.account.address}`);
  if (options.dryRun) console.log('DRY RUN: nothing will be sent\n');
  else console.log('');

  switch (options.command) {
    case 'status':
      return status(ctx);
    case 'setup':
      return setup(ctx);
    case 'transact':
      return transact(ctx);
    case 'teardown':
      return teardown(ctx);
  }
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`Error: ${error.message}\n\nRun with --help for usage.`);
  } else {
    console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
});
