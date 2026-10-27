/**
 * guarded-safe-setup.ts
 *
 * Standalone CLI to set up (and tear down) a Safe guarded by the Safe Policy Engine
 * (https://github.com/safe-research/policy-engine): deploys the Safe if needed, configures policies,
 * spending limits and the guard in ONE MultiSend Safe transaction, then exercises the policies with a
 * few real transactions.
 *
 * ─── Requirements ─────────────────────────────────────────────────────────────────────────────────
 *   - Node.js >= 22.18 (runs TypeScript natively), or Node >= 18 with `npx tsx guarded-safe-setup.ts`.
 *   - `viem` v2 and `@safe-global/protocol-kit` v8, resolvable from the script's directory:
 *       npm i viem@2 @safe-global/protocol-kit@8
 *   - An RPC endpoint. Dry runs need `eth_simulateV1`; `teardown` needs `eth_getLogs`.
 *   - The signer must be an owner of the Safe, and the Safe's threshold must be 1.
 *
 * ─── Configuration and signer ─────────────────────────────────────────────────────────────────────
 *   Environment-specific settings and secrets are read from the environment, never hard-coded:
 *     PRIVATE_KEY    signer key (never pass a key as an argument)
 *     RPC_URL        JSON-RPC endpoint (or --rpc-url); LOGS_RPC_URL: archive logs for `teardown`
 *     TEST_TOKEN     ERC-20 for the token policies (or --token)
 *     CO_OWNER       default demo-transfer recipient (or --recipient)
 *     ALLOWLIST      default extra allowlist, comma-separated (or --allowlist)
 *   They are documented in playground/protocol-kit/.example.env: copy it to .env next to it and let
 *   Node load it (variables already in the environment win, e.g. from CI or a secret manager):
 *     node --env-file-if-exists=playground/protocol-kit/.env playground/protocol-kit/policies/guarded-safe-setup.ts <command>
 *   Use `--private-key-env NAME` to read the key from a different variable, or `--from <address>` to
 *   dry-run without a key / to send through an RPC that holds the account unlocked.
 *
 * ─── Commands ─────────────────────────────────────────────────────────────────────────────────────
 *   setup     (default) Deploy the Safe if it does not exist (CREATE2: owners + salt nonce), then in a
 *             single MultiSend Safe transaction: enable the Allowance Module, add the delegate, set ETH
 *             and ERC-20 spending limits, configure every policy on the guard (`configureImmediately`),
 *             and install the guard as both transaction guard and module guard. Then sends demo
 *             transactions through the guard: owner ERC-20 transfer, owner ETH transfer, and an ETH +
 *             ERC-20 transfer through the Allowance Module (checked by the module guard).
 *   teardown  Remove every policy (on every known guard), invalidate pending configuration roots, and
 *             remove the transaction guard and module guard from one or more Safes. Discovers the
 *             configuration from the guards' `PolicyConfirmed`/`RootConfigured` events.
 *   exec      Execute one arbitrary Safe transaction (e.g. to move funds out of a Safe).
 *   help      Show the command overview; `help <command>` shows that command's options.
 *
 * ─── Examples ─────────────────────────────────────────────────────────────────────────────────────
 *   # (with the variables loaded as above)
 *   # Preview everything (simulated on-chain with eth_simulateV1, nothing is sent):
 *   node guarded-safe-setup.ts setup --dry-run
 *
 *   # Real run on Sepolia with all defaults (60s-delay guard, test token, spending limits, demo txs):
 *   node guarded-safe-setup.ts setup
 *
 *   # Another Safe (different salt), other chain + RPC, 1-of-2 owners (signer included), own token
 *   # and allowlist, no demo transactions:
 *   node guarded-safe-setup.ts setup --rpc-url https://polygon-rpc.com \
 *     --salt-nonce 7 --owners 0xOwnerA,0xOwnerB --token 0xToken --allowlist 0xA,0xB --no-demo
 *
 *   # Tear down policies and guards from Safes you own:
 *   node guarded-safe-setup.ts teardown --safe 0xSafe1,0xSafe2 --dry-run
 *
 *   # Move 100 tokens (18 decimals) out of a Safe you own:
 *   node guarded-safe-setup.ts exec --safe 0xSafe --to 0xToken \
 *     --data $(cast calldata "transfer(address,uint256)" 0xRecipient 100000000000000000000)
 *
 *   Run `node guarded-safe-setup.ts help` for the command overview, and
 *   `node guarded-safe-setup.ts help <command>` (or `<command> --help`) for every option and its default.
 *
 * ─── Notes ────────────────────────────────────────────────────────────────────────────────────────
 *   - Safe contracts (singleton, proxy factory, fallback handler, MultiSendCallOnly) are the v1.5.0
 *     deployments that protocol-kit resolves for the chain; protocol-kit also predicts the Safe
 *     address, builds the deployment, batches calls through MultiSendCallOnly and encodes every
 *     Safe transaction.
 *   - Requires a Safe v1.5.x: v1.5.0 is the first version with a module guard, without which module
 *     transactions (the Allowance Module) would bypass the policy engine entirely.
 *   - `configureImmediately` only works while the guard is NOT installed, which is why policies and
 *     the guard installation are batched in one transaction (policies first, guard last). Any later
 *     change goes through `requestConfiguration` -> wait the guard's DELAY -> `applyConfiguration`.
 *   - The guard rejects Safe transactions with non-zero `safeTxGas` or `gasPrice`; every Safe
 *     transaction sent here uses 0 for both, and an owner "pre-validated" signature (v = 1), so the
 *     signer must also be the account submitting the transaction.
 *   - A policy is keyed by (target, selector, operation). The defaults allowlist the same set of
 *     addresses for native transfers, ERC-20 transfers and ERC-20 approvals; the Safe owners and the
 *     demo recipient are always added to that allowlist.
 *   - By default AllowPolicy covers the Safe's own `enableModule`, `setGuard` and `setModuleGuard`, so
 *     the owners can remove the guard without waiting out its DELAY (convenient for test setups, and
 *     what makes `teardown` a two-transaction job). Pass `--allow-safe-calls enableModule` to keep
 *     guard removal behind the delay; `teardown` then requests, waits and applies it automatically.
 */
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

import {
  createPublicClient,
  createWalletClient,
  decodeAbiParameters,
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionResult,
  defineChain,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  formatUnits,
  getAddress,
  http,
  isAddress,
  isHex,
  keccak256,
  pad,
  parseAbi,
  parseUnits,
  size,
  toEventSelector,
  toFunctionSelector,
  toHex,
  zeroAddress
} from 'viem'
import type { Abi, Account, Address, Chain, Hex, PublicClient, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import Safe, { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import type { MetaTransactionData, OperationType, SafeTransaction } from '@safe-global/types-kit'

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Deployments
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type PolicyKind =
  | 'ALLOW'
  | 'DENY'
  | 'ALLOWED_MODULE'
  | 'COSIGNER'
  | 'ERC20_APPROVE'
  | 'ERC20_TRANSFER'
  | 'MULTISEND'
  | 'NATIVE_TRANSFER'

/** Policy contracts (deterministic deployment, same address on every supported chain). */
const DEFAULT_POLICIES: Record<PolicyKind, Address> = {
  ALLOW: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
  DENY: '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436',
  ALLOWED_MODULE: '0x4736245188E315cB18b5DC2A9D7f92893D6e8CD7',
  COSIGNER: '0x65Bc0DADF4173C6d7125300cad9360339B3Ee478',
  ERC20_APPROVE: '0xfF86DD4caf79672E55e0C3e3A5410746600d60F4',
  ERC20_TRANSFER: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
  MULTISEND: '0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c',
  NATIVE_TRANSFER: '0x2868C263EBF3672211E4C32e0B21689FF0584ca3'
}

/** Superseded, stateless policy deployments still referenced by older configurations. */
const LEGACY_POLICIES: Record<Address, string> = {
  '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246': 'NATIVE_TRANSFER (legacy)'
}

/** `SafePolicyGuard` deployments by configuration DELAY in seconds (all with a 604800s EXPIRY). */
const GUARDS_BY_DELAY: Record<string, Address> = {
  '0': '0x55c241591E12CE3c58491D02b737F12D3199ae95',
  '60': '0xC83bC185770ac0Da8A970f35695064eEe62e236c',
  '600': '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57',
  '3600': '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20',
  '86400': '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED'
}

/** Additional guard deployments `teardown` inspects on a given chain (older, non-indexed ones). */
const EXTRA_TEARDOWN_GUARDS: Record<number, Address[]> = {
  11155111: ['0x5202B1ebE100812437d47eae769e155945fbba6a'] // 5s delay, legacy test guard
}

/** First block with a guard deployment, to bound the `teardown` event scan. */
const GUARD_SCAN_FROM_BLOCK: Record<number, bigint> = {
  11155111: 11675059n
}

/** Safe version of new Safes; protocol-kit resolves its deployments (safe-global/safe-deployments). */
const SAFE_VERSION = '1.5.0'

/** Safe Allowance Module ("spending limits"), the deployment indexed on each chain. */
const ALLOWANCE_MODULE_V1_0_0: Address = '0x691f59471Bfd2B7d639DCF74671a2d648ED1E331'
const ALLOWANCE_MODULES: Record<number, Address> = {
  1: ALLOWANCE_MODULE_V1_0_0,
  10: ALLOWANCE_MODULE_V1_0_0,
  56: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134',
  100: ALLOWANCE_MODULE_V1_0_0,
  137: ALLOWANCE_MODULE_V1_0_0,
  143: '0xAA46724893dedD72658219405185Fb0Fc91e091C',
  4663: ALLOWANCE_MODULE_V1_0_0,
  8453: ALLOWANCE_MODULE_V1_0_0,
  42161: ALLOWANCE_MODULE_V1_0_0,
  11155111: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'
}

/** Where the environment variables are documented. */
const EXAMPLE_ENV = 'playground/protocol-kit/.example.env'
/** Hashed into the default salt nonce: kept from the script's former name, so default Safes keep their address. */
const DEFAULT_SALT_LABEL = 'safe-policy-setup.v1'

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// ABIs, selectors, constants
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Safe calls encoded directly: the setup batch targets a Safe that may not be deployed yet, which
 * protocol-kit's `create*Tx` helpers do not support. The views back the post-condition checks.
 */
const SAFE_ABI = parseAbi([
  'function enableModule(address module)',
  'function setGuard(address guard)',
  'function setModuleGuard(address moduleGuard)',
  'function isModuleEnabled(address module) view returns (bool)',
  'function getStorageAt(uint256 offset, uint256 length) view returns (bytes)'
])

const CONFIGURATION_COMPONENTS = [
  { name: 'target', type: 'address' },
  { name: 'selector', type: 'bytes4' },
  { name: 'operation', type: 'uint8' },
  { name: 'policy', type: 'address' },
  { name: 'data', type: 'bytes' }
] as const

const GUARD_ABI = parseAbi([
  'struct Configuration { address target; bytes4 selector; uint8 operation; address policy; bytes data; }',
  'function configureImmediately(Configuration[] configurations)',
  'function requestConfiguration(bytes32 configureRoot)',
  'function applyConfiguration(Configuration[] configurations)',
  'function invalidateRoot(bytes32 configureRoot)',
  'function rootConfigured(address safe, bytes32 root) view returns (uint256)',
  'function getPolicy(address safe, address to, bytes data, uint8 operation) view returns (uint256 access, address policy)',
  'function DELAY() view returns (uint256)',
  'function EXPIRY() view returns (uint256)',
  'event PolicyConfirmed(address indexed safe, address indexed target, bytes4 selector, uint8 operation, address policy, bytes data)',
  'event RootConfigured(address indexed safe, bytes32 indexed root, uint256 timestamp)'
])

const POLICY_ABI = parseAbi([
  'function getRecipientPermission(address policyGuard, address safe, address token, address recipient) view returns (uint8)',
  'function getSpenderPermission(address policyGuard, address safe, address token, address spender) view returns (uint8)',
  'function isModuleAllowed(address policyGuard, address safe, address module) view returns (bool)'
])

const ALLOWANCE_MODULE_ABI = parseAbi([
  'function addDelegate(address delegate)',
  'function removeDelegate(address delegate, bool removeAllowances)',
  'function setAllowance(address delegate, address token, uint96 allowanceAmount, uint16 resetTimeMin, uint32 resetBaseMin)',
  'function resetAllowance(address delegate, address token)',
  'function deleteAllowance(address delegate, address token)',
  'function executeAllowanceTransfer(address safe, address token, address to, uint96 amount, address paymentToken, uint96 payment, address delegate, bytes signature)',
  'function getTokenAllowance(address safe, address delegate, address token) view returns (uint256[5])'
])

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
])

/** Every custom error the guard, the policies and the Allowance Module can revert with. */
const ERRORS_ABI = parseAbi([
  'error Error(string message)',
  'error AccessDenied(address policy)',
  'error PolicyReverted(address policy, bytes reason)',
  'error GuardTargetDenied()',
  'error ModuleConfigurationDenied()',
  'error PolicyConfigurationFailed()',
  'error InvalidSelector()',
  'error Reentrancy()',
  'error NotChecking()',
  'error CrossSafeCheck()',
  'error RootAlreadyConfigured(bytes32 root)',
  'error RootNotConfigured(bytes32 root)',
  'error RootConfigurationPending()',
  'error RootConfigurationExpired()',
  'error GuardAlreadyEnabled()',
  'error NonZeroGasPrice()',
  'error NonZeroSafeTxGas()',
  'error ExecutionFailed()',
  'error ModuleExecutionFailed()',
  'error Unauthorized()',
  'error InvalidTransfer()',
  'error InvalidApproval()',
  'error InvalidOperation()',
  'error CalldataNotPermitted()',
  'error UnauthorizedModule()',
  'error InvalidModule()',
  'error InvalidMultiSend()',
  'error OwnableUnauthorizedAccount(address account)',
  'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)'
])

const SAFE_ERROR_HINTS: Record<string, string> = {
  GS013: 'the Safe transaction reverted (inner call failed)',
  GS025: 'hash not approved',
  GS026: 'invalid owner (the signer is not an owner of the Safe)',
  GS031: 'method can only be called from this contract',
  GS104: 'method can only be called from an enabled module',
  GS300: 'guard does not implement the transaction guard interface',
  GS301: 'guard does not implement the module guard interface'
}

const CALL = 0
const DELEGATECALL = 1
type Operation = typeof CALL | typeof DELEGATECALL

const PERMISSION = { none: 0, once: 1, always: 2 } as const

const GUARD_STORAGE_SLOT: Hex = '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'
const MODULE_GUARD_STORAGE_SLOT: Hex =
  '0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947'

const SEL = {
  transfer: toFunctionSelector('transfer(address,uint256)'),
  transferFrom: toFunctionSelector('transferFrom(address,address,uint256)'),
  approve: toFunctionSelector('approve(address,uint256)'),
  multiSend: toFunctionSelector('multiSend(bytes)'),
  setGuard: toFunctionSelector('setGuard(address)'),
  native: '0x00000000' as Hex
}

/** Safe self-calls that `--allow-safe-calls` can attach the AllowPolicy to. */
const SAFE_CALLS: Record<string, Hex> = {
  enableModule: toFunctionSelector('enableModule(address)'),
  disableModule: toFunctionSelector('disableModule(address,address)'),
  setGuard: toFunctionSelector('setGuard(address)'),
  setModuleGuard: toFunctionSelector('setModuleGuard(address)'),
  setFallbackHandler: toFunctionSelector('setFallbackHandler(address)'),
  addOwnerWithThreshold: toFunctionSelector('addOwnerWithThreshold(address,uint256)'),
  removeOwner: toFunctionSelector('removeOwner(address,address,uint256)'),
  swapOwner: toFunctionSelector('swapOwner(address,address,address)'),
  changeThreshold: toFunctionSelector('changeThreshold(uint256)')
}

/** Allowance Module owner calls, allowed so the Safe can keep managing spending limits. */
const ALLOWANCE_ADMIN_SELECTORS: Hex[] = [
  'addDelegate(address)',
  'removeDelegate(address,bool)',
  'setAllowance(address,address,uint96,uint16,uint32)',
  'resetAllowance(address,address)',
  'deleteAllowance(address,address)'
].map((signature) => toFunctionSelector(signature))

const RECIPIENT_LIST_PARAMS = [
  {
    type: 'tuple[]',
    components: [
      { name: 'account', type: 'address' },
      { name: 'permission', type: 'uint8' }
    ]
  }
] as const

const MAX_UINT96 = 2n ** 96n - 1n

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type Configuration = {
  target: Address
  selector: Hex
  operation: Operation
  policy: Address
  data: Hex
}

type TxStep = {
  kind: 'tx'
  label: string
  to: Address
  data: Hex
  value: bigint
  /** Set when the step is a Safe `execTransaction`, to verify its `ExecutionSuccess` event. */
  safe?: Address
}

type WaitStep = {
  kind: 'wait'
  label: string
  seconds: bigint
  /** Live mode: reads the exact timestamp to wait for once the preceding steps are mined. */
  until?: () => Promise<bigint>
}

type Step = TxStep | WaitStep

/** A read-only call evaluated after all steps; `verify` returns an error message on mismatch. */
type Check = {
  label: string
  to: Address
  data: Hex
  verify: (returnData: Hex) => string | undefined
}

type Plan = {
  title: string
  steps: Step[]
  checks: Check[]
  summary: Record<string, unknown>
  /** Printed after a successful live run. */
  note?: string
}

type Ctx = {
  rpcUrl: string
  client: PublicClient
  wallet?: WalletClient
  account?: Account | Address
  chain: Chain
  sender: Address
  dryRun: boolean
  yes: boolean
}

class CliError extends Error {}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const COMMON_OPTIONS = {
  'rpc-url': { type: 'string' },
  'private-key-env': { type: 'string', default: 'PRIVATE_KEY' },
  from: { type: 'string' },
  'dry-run': { type: 'boolean', default: false },
  yes: { type: 'boolean', short: 'y', default: false },
  out: { type: 'string' },
  help: { type: 'boolean', short: 'h', default: false }
} as const

const SETUP_OPTIONS = {
  ...COMMON_OPTIONS,
  safe: { type: 'string' },
  owners: { type: 'string' },
  'salt-nonce': { type: 'string' },
  singleton: { type: 'string' },
  'guard-delay': { type: 'string', default: '60' },
  guard: { type: 'string' },
  allowlist: { type: 'string' },
  permission: { type: 'string', default: 'always' },
  'allow-safe-calls': { type: 'string', default: 'enableModule,setGuard,setModuleGuard' },
  token: { type: 'string' },
  'no-token': { type: 'boolean', default: false },
  'allowance-module': { type: 'string' },
  'no-allowance': { type: 'boolean', default: false },
  delegate: { type: 'string' },
  'eth-allowance': { type: 'string', default: '0.01' },
  'token-allowance': { type: 'string', default: '100' },
  'allowance-reset-min': { type: 'string', default: '1440' },
  recipient: { type: 'string' },
  'eth-transfer': { type: 'string', default: '0.0001' },
  'token-transfer': { type: 'string', default: '1' },
  'allowance-eth-transfer': { type: 'string', default: '0.0001' },
  'allowance-token-transfer': { type: 'string', default: '1' },
  'no-demo': { type: 'boolean', default: false },
  'no-fund': { type: 'boolean', default: false },
  policy: { type: 'string', multiple: true }
} as const

const TEARDOWN_OPTIONS = {
  ...COMMON_OPTIONS,
  safe: { type: 'string' },
  guards: { type: 'string' },
  policy: { type: 'string', multiple: true },
  'logs-rpc-url': { type: 'string' },
  'from-block': { type: 'string' },
  'log-chunk': { type: 'string', default: '50000' },
  'max-wait': { type: 'string', default: '900' }
} as const

const EXEC_OPTIONS = {
  ...COMMON_OPTIONS,
  safe: { type: 'string' },
  to: { type: 'string' },
  value: { type: 'string', default: '0' },
  data: { type: 'string', default: '0x' },
  operation: { type: 'string', default: 'call' }
} as const

const COMMON_HELP = `
Common options:
  --rpc-url <url>            JSON-RPC endpoint; the chain is taken from it   [RPC_URL]
  --private-key-env <name>   Environment variable holding the signer key     [PRIVATE_KEY]
  --from <address>           Signer address without a key: dry runs, or an RPC with the account unlocked
  --dry-run                  Simulate every step on-chain (eth_simulateV1); send nothing
  -y, --yes                  Do not ask for confirmation before sending transactions
  --out <file>               Write a JSON summary of the run to <file>
  -h, --help                 Show help

Settings come from the environment (PRIVATE_KEY, RPC_URL, LOGS_RPC_URL, TEST_TOKEN, CO_OWNER,
ALLOWLIST); see ${EXAMPLE_ENV}. Load them with node --env-file-if-exists=<path to .env>.`

const SETUP_HELP = `Usage: node guarded-safe-setup.ts setup [options]

Deploys the Safe (if missing) and configures policies, spending limits and the guard in one Safe
transaction, then runs demo transactions through the guard.

Safe:
  --safe <address>               Use this existing Safe instead of the CREATE2 address
  --owners <a,b,...>             Owners for a new Safe (threshold is always 1)   [signer]
  --salt-nonce <n>               CREATE2 salt nonce, decimal or 0x-hex   [keccak256("${DEFAULT_SALT_LABEL}")]
  --singleton <l1|l2>            Safe v${SAFE_VERSION} singleton: Safe (l1) or SafeL2 (l2)   [l1 on chain 1, l2 elsewhere]
                                 Proxy factory, fallback handler and MultiSendCallOnly are the v${SAFE_VERSION}
                                 deployments protocol-kit resolves for the chain.

Guard and policies:
  --guard-delay <seconds>        Guard by configuration delay: ${Object.keys(GUARDS_BY_DELAY).join(', ')}   [60]
  --guard <address>              Explicit SafePolicyGuard (overrides --guard-delay)
  --allowlist <a,b,...>          Allowed native/ERC-20 recipients and ERC-20 spenders
                                 [ALLOWLIST] (the owners and the recipient are always added)
  --permission <always|once>     Permission granted to every allowlisted address   [always]
  --allow-safe-calls <names>     Safe self-calls allowed by AllowPolicy, comma separated, from:
                                 ${Object.keys(SAFE_CALLS).join(', ')}
                                 [enableModule,setGuard,setModuleGuard]
  --policy <KIND=address>        Override a policy address (repeatable). Kinds:
                                 ${Object.keys(DEFAULT_POLICIES).join(', ')}

Token and spending limits:
  --token <address>              ERC-20 for token policies, spending limit and demo [TEST_TOKEN]
  --no-token                     Skip everything ERC-20 related
  --allowance-module <address>   Allowance Module                        [chain default, see source]
  --no-allowance                 Skip the Allowance Module (spending limits)
  --delegate <address>           Spending-limit delegate                 [signer]
  --eth-allowance <eth>          ETH spending limit                      [0.01]
  --token-allowance <amount>     Token spending limit, in token units    [100]
  --allowance-reset-min <min>    Spending-limit reset period in minutes, 0 = one-time   [1440]

Demo transactions (sent after the setup, all checked by the guard):
  --recipient <address>          Recipient of every demo transfer        [CO_OWNER]
  --eth-transfer <eth>           Owner ETH transfer, 0 to skip           [0.0001]
  --token-transfer <amount>      Owner token transfer, 0 to skip         [1]
  --allowance-eth-transfer <eth> ETH transfer via the Allowance Module, 0 to skip     [0.0001]
  --allowance-token-transfer <n> Token transfer via the Allowance Module, 0 to skip   [1]
  --no-demo                      Skip all demo transactions
  --no-fund                      Do not top up the Safe from the signer for the demo transfers
${COMMON_HELP}`

const TEARDOWN_HELP = `Usage: node guarded-safe-setup.ts teardown --safe <a,b,...> [options]

Removes every policy configured for the Safe on every known guard, invalidates pending configuration
roots, clears stateful policy permissions (ERC-20 recipients/spenders, allowed modules), and removes
the transaction guard and module guard. Modules and owners are left untouched.

  --safe <a,b,...>           Safe(s) to tear down (required)
  --guards <a,b,...>         Additional guard addresses to clean (all known guards are included)
  --policy <KIND=address>    Override a policy address (repeatable), as in setup
  --logs-rpc-url <url>       RPC with full eth_getLogs history for the event scan
                             [LOGS_RPC_URL, else the RPC]
  --from-block <n>           First block of the event scan       [first guard deployment]
  --log-chunk <n>            eth_getLogs block range per request (halved on errors)   [50000]
  --max-wait <seconds>       Longest guard delay to wait for; longer delays stop after the request
                             and are resumed by re-running the command   [900]
${COMMON_HELP}`

const EXEC_HELP = `Usage: node guarded-safe-setup.ts exec --safe <address> --to <address> [options]

Executes one Safe transaction signed by the signer (an owner of a threshold-1 Safe).

  --safe <address>           The Safe (required)
  --to <address>             Call target (required)
  --value <eth>              ETH value                [0]
  --data <hex>               Calldata                 [0x]
  --operation <call|delegatecall>                     [call]
${COMMON_HELP}`

const MAIN_HELP = `Usage: node guarded-safe-setup.ts <command> [options]

Commands:
  setup             Deploy and configure a policy-guarded Safe, then run demo transactions (default)
  teardown          Remove all policies and guards from Safes
  exec              Execute a single Safe transaction
  help [command]    Show this overview, or the options of <command>

Run "help <command>" or "<command> --help" for the options of each command.`

const COMMAND_HELP: Record<string, string> = {
  setup: SETUP_HELP,
  teardown: TEARDOWN_HELP,
  exec: EXEC_HELP
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const command = argv[0] !== undefined && !argv[0].startsWith('-') ? argv[0] : 'setup'
  const rest = argv[0] === command ? argv.slice(1) : argv

  // `help`, `help <command>`, and a bare `--help`/`-h` (no command given).
  if (command === 'help' || (command !== argv[0] && /^(-h|--help)$/.test(argv[0] ?? ''))) {
    const topic = command === 'help' ? rest[0] : undefined
    if (topic === undefined) return console.log(MAIN_HELP)
    const text = COMMAND_HELP[topic]
    if (text === undefined) throw new CliError(`unknown command "${topic}"\n\n${MAIN_HELP}`)
    return console.log(text)
  }
  if (command === 'setup') {
    const { values } = parseArgs({ args: rest, options: SETUP_OPTIONS, strict: true })
    if (values.help) return console.log(SETUP_HELP)
    const ctx = await createContext(values)
    await runPlan(ctx, await planSetup(ctx, values), values.out)
    return
  }
  if (command === 'teardown') {
    const { values } = parseArgs({ args: rest, options: TEARDOWN_OPTIONS, strict: true })
    if (values.help) return console.log(TEARDOWN_HELP)
    const ctx = await createContext(values)
    const safes = parseAddressList(required(values.safe, '--safe'), '--safe')
    const summaries: Record<string, unknown>[] = []
    for (const safe of safes) {
      summaries.push(await runPlan(ctx, await planTeardown(ctx, safe, values)))
    }
    if (values.out !== undefined)
      writeSummary(values.out, { command, chainId: ctx.chain.id, safes: summaries })
    return
  }
  if (command === 'exec') {
    const { values } = parseArgs({ args: rest, options: EXEC_OPTIONS, strict: true })
    if (values.help) return console.log(EXEC_HELP)
    const ctx = await createContext(values)
    await runPlan(ctx, await planExec(ctx, values), values.out)
    return
  }
  throw new CliError(`unknown command "${command}"\n\n${MAIN_HELP}`)
}

async function createContext(values: {
  'rpc-url'?: string
  'private-key-env': string
  from?: string
  'dry-run': boolean
  yes: boolean
}): Promise<Ctx> {
  const rpcUrl =
    values['rpc-url'] ?? requireEnvValue('RPC_URL', 'the JSON-RPC endpoint, or pass --rpc-url')
  const transport = http(rpcUrl, { retryCount: 3, timeout: 60_000 })
  const probe = createPublicClient({ transport })
  const chainId = await probe.getChainId()
  const chain = defineChain({
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } }
  })
  const client = createPublicClient({ chain, transport }) as PublicClient

  const keyName = values['private-key-env']
  const key = process.env[keyName]?.trim()
  const from = values.from !== undefined ? parseAddress(values.from, '--from') : undefined
  let account: Account | Address | undefined
  if (key !== undefined && key !== '') {
    const hexKey = (key.startsWith('0x') ? key : `0x${key}`) as Hex
    if (!isHex(hexKey) || size(hexKey) !== 32) {
      throw new CliError(`${keyName} is not a 32-byte hex private key`)
    }
    account = privateKeyToAccount(hexKey)
    if (from !== undefined && from !== account.address) {
      throw new CliError(`--from ${from} does not match the ${keyName} account ${account.address}`)
    }
  } else if (from !== undefined) {
    account = from
  } else {
    throw new CliError(
      `no signer: set ${keyName} in the environment (see ${EXAMPLE_ENV}), or pass --from <address>`
    )
  }
  const sender = typeof account === 'string' ? account : account.address
  const wallet = createWalletClient({ account, chain, transport })

  console.log(`chain ${chainId} via ${redactUrl(rpcUrl)}`)
  console.log(
    `signer ${sender}${typeof account === 'string' ? ' (no key: unlocked RPC account)' : ''}`
  )
  console.log(`mode ${values['dry-run'] ? 'DRY RUN (simulation only)' : 'LIVE'}`)
  return {
    rpcUrl,
    client,
    wallet,
    account,
    chain,
    sender,
    dryRun: values['dry-run'],
    yes: values.yes
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// setup
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type SetupValues = ReturnType<typeof parseArgs<{ options: typeof SETUP_OPTIONS }>>['values']

async function planSetup(ctx: Ctx, v: SetupValues): Promise<Plan> {
  const { client, sender } = ctx
  const chainId = ctx.chain.id
  const policies = resolvePolicies(v.policy)
  const permission = PERMISSION[v.permission as keyof typeof PERMISSION]
  if (permission === undefined || permission === PERMISSION.none) {
    throw new CliError('--permission must be "always" or "once"')
  }

  // Guard.
  let guard: Address
  if (v.guard !== undefined) {
    guard = parseAddress(v.guard, '--guard')
  } else {
    const byDelay = GUARDS_BY_DELAY[String(parseBigInt(v['guard-delay'], '--guard-delay'))]
    if (byDelay === undefined) {
      throw new CliError(`no known guard with delay ${v['guard-delay']}s; use --guard <address>`)
    }
    guard = byDelay
  }
  await requireCode(client, guard, 'SafePolicyGuard')
  const [delay, expiry] = await Promise.all([
    client.readContract({ address: guard, abi: GUARD_ABI, functionName: 'DELAY' }),
    client.readContract({ address: guard, abi: GUARD_ABI, functionName: 'EXPIRY' })
  ])
  if (v.guard === undefined && delay !== parseBigInt(v['guard-delay'], '--guard-delay')) {
    throw new CliError(`guard ${guard} has DELAY ${delay}, expected ${v['guard-delay']}`)
  }

  // Token.
  const tokenAddress = v['no-token']
    ? undefined
    : v.token !== undefined
      ? parseAddress(v.token, '--token')
      : envAddressValue('TEST_TOKEN')
  if (!v['no-token'] && tokenAddress === undefined) {
    console.warn('! no token: ERC-20 steps skipped (set TEST_TOKEN or pass --token to enable)')
  }
  let token: { address: Address; decimals: number; symbol: string } | undefined
  if (tokenAddress !== undefined) {
    await requireCode(client, tokenAddress, 'token')
    const [decimals, symbol] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }),
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' })
    ])
    token = { address: tokenAddress, decimals, symbol }
  }

  // Allowance Module.
  const allowanceModule = v['no-allowance']
    ? undefined
    : v['allowance-module'] !== undefined
      ? parseAddress(v['allowance-module'], '--allowance-module')
      : ALLOWANCE_MODULES[chainId]
  if (!v['no-allowance'] && allowanceModule === undefined) {
    throw new CliError(
      `no known Allowance Module on chain ${chainId}: pass --allowance-module or --no-allowance`
    )
  }
  const delegate = v.delegate !== undefined ? parseAddress(v.delegate, '--delegate') : sender
  const resetTimeMin = parseBigInt(v['allowance-reset-min'], '--allowance-reset-min')
  if (resetTimeMin > 65535n)
    throw new CliError('--allowance-reset-min must fit in uint16 (<= 65535)')
  const ethAllowance = parseAmount(v['eth-allowance'], 18, '--eth-allowance')
  const tokenAllowance = token
    ? parseAmount(v['token-allowance'], token.decimals, '--token-allowance')
    : 0n
  if (ethAllowance > MAX_UINT96 || tokenAllowance > MAX_UINT96) {
    throw new CliError('spending limits must fit in uint96')
  }

  // Demo amounts.
  const demo = !v['no-demo']
  const ethTransfer = demo ? parseAmount(v['eth-transfer'], 18, '--eth-transfer') : 0n
  const tokenTransfer =
    demo && token ? parseAmount(v['token-transfer'], token.decimals, '--token-transfer') : 0n
  const allowanceEthTransfer =
    demo && allowanceModule
      ? parseAmount(v['allowance-eth-transfer'], 18, '--allowance-eth-transfer')
      : 0n
  const allowanceTokenTransfer =
    demo && allowanceModule && token
      ? parseAmount(v['allowance-token-transfer'], token.decimals, '--allowance-token-transfer')
      : 0n
  // The recipient is needed (and allowlisted) only when a demo transfer is sent.
  const sendsDemo = ethTransfer + tokenTransfer + allowanceEthTransfer + allowanceTokenTransfer > 0n
  const recipient =
    v.recipient !== undefined
      ? parseAddress(v.recipient, '--recipient')
      : sendsDemo
        ? parseAddress(
            requireEnvValue('CO_OWNER', 'the demo-transfer recipient, or pass --recipient'),
            'CO_OWNER'
          )
        : undefined
  const delegateCanSign = delegate === sender
  if ((allowanceEthTransfer > 0n || allowanceTokenTransfer > 0n) && !delegateCanSign) {
    throw new CliError(
      'Allowance Module demo transfers are sent by the delegate: use --delegate equal to the signer, ' +
        'or set --allowance-eth-transfer 0 --allowance-token-transfer 0'
    )
  }

  // Contracts that must exist.
  const usedPolicies: PolicyKind[] = ['ALLOW', 'MULTISEND', 'NATIVE_TRANSFER']
  if (token) usedPolicies.push('ERC20_TRANSFER', 'ERC20_APPROVE')
  await Promise.all([
    ...(allowanceModule ? [requireCode(client, allowanceModule, 'Allowance Module')] : []),
    ...usedPolicies.map((kind) => requireCode(client, policies[kind], `${kind} policy`))
  ])

  // Safe: explicit, or predicted by protocol-kit from (owners, threshold 1, salt nonce, v1.5.0).
  const isL1SafeSingleton = resolveL1Singleton(v.singleton, chainId)
  const saltNonce =
    v['salt-nonce'] !== undefined
      ? parseBigInt(v['salt-nonce'], '--salt-nonce')
      : BigInt(keccak256(toHex(DEFAULT_SALT_LABEL)))
  let owners = v.owners !== undefined ? parseAddressList(v.owners, '--owners') : [sender]
  const steps: Step[] = []
  let sdk: Safe
  let exists: boolean

  if (v.safe !== undefined) {
    sdk = await connectSafe(ctx, parseAddress(v.safe, '--safe'))
    exists = true
  } else {
    if (!owners.includes(sender)) {
      throw new CliError(
        `the signer ${sender} must be one of --owners (it executes every Safe transaction)`
      )
    }
    sdk = await Safe.init({
      provider: ctx.rpcUrl,
      isL1SafeSingleton,
      predictedSafe: {
        safeAccountConfig: { owners, threshold: 1 },
        safeDeploymentConfig: { saltNonce: saltNonce.toString(), safeVersion: SAFE_VERSION }
      }
    })
    exists = await sdk.isSafeDeployed()
    if (exists) {
      sdk = await connectSafe(ctx, getAddress(await sdk.getAddress()))
    } else {
      const deployment = await sdk.createSafeDeploymentTransaction()
      steps.push({
        kind: 'tx',
        label: `deploy Safe ${getAddress(await sdk.getAddress())} (salt nonce ${toHex(saltNonce)})`,
        to: getAddress(deployment.to),
        data: deployment.data as Hex,
        value: BigInt(deployment.value)
      })
    }
  }
  const safe = getAddress(await sdk.getAddress())
  const multiSend = getAddress(sdk.getMultiSendCallOnlyAddress())

  // Existing Safe: validate it and read what is already in place.
  let alreadyConfigured = false
  let moduleEnabled = false
  let safeEth = 0n
  let safeToken = 0n
  if (exists) {
    const info = await readSafe(sdk)
    requireSafeVersion(info.version, safe, '1.5')
    requireSoleSigner(info, safe, sender)
    owners = info.owners
    if (info.guard === guard && info.moduleGuard === guard) {
      alreadyConfigured = true
    } else if (info.guard !== zeroAddress || info.moduleGuard !== zeroAddress) {
      throw new CliError(
        `Safe ${safe} already has guard ${info.guard} / module guard ${info.moduleGuard}; ` +
          'run "teardown" first, or pass the installed guard with --guard'
      )
    }
    ;[moduleEnabled, safeEth, safeToken] = await Promise.all([
      allowanceModule ? sdk.isModuleEnabled(allowanceModule) : Promise.resolve(false),
      sdk.getBalance(),
      token ? erc20Balance(client, token.address, safe) : Promise.resolve(0n)
    ])
  }

  const allowlist = dedupe([
    ...(v.allowlist !== undefined
      ? parseAddressList(v.allowlist, '--allowlist')
      : parseOptionalAddressList(envValue('ALLOWLIST'), 'ALLOWLIST')),
    ...(recipient !== undefined ? [recipient] : []),
    ...owners
  ])
  const safeCalls = parseSafeCalls(v['allow-safe-calls'])

  // Policy configuration.
  const configurations: Configuration[] = []
  const allow = (target: Address, selector: Hex): void => {
    configurations.push({ target, selector, operation: CALL, policy: policies.ALLOW, data: '0x' })
  }
  for (const name of safeCalls) allow(safe, SAFE_CALLS[name])
  if (allowanceModule)
    for (const selector of ALLOWANCE_ADMIN_SELECTORS) allow(allowanceModule, selector)
  configurations.push({
    target: multiSend,
    selector: SEL.multiSend,
    operation: DELEGATECALL,
    policy: policies.MULTISEND,
    data: '0x'
  })
  for (const account of allowlist) {
    configurations.push({
      target: account,
      selector: SEL.native,
      operation: CALL,
      policy: policies.NATIVE_TRANSFER,
      data: '0x'
    })
  }
  if (token) {
    const list = encodeAbiParameters(RECIPIENT_LIST_PARAMS, [
      allowlist.map((account) => ({ account, permission }))
    ])
    for (const selector of [SEL.transfer, SEL.transferFrom]) {
      configurations.push({
        target: token.address,
        selector,
        operation: CALL,
        policy: policies.ERC20_TRANSFER,
        data: list
      })
    }
    configurations.push({
      target: token.address,
      selector: SEL.approve,
      operation: CALL,
      policy: policies.ERC20_APPROVE,
      data: list
    })
  }

  // Top up the Safe for the demo transfers.
  const ethNeeded = ethTransfer + allowanceEthTransfer
  const tokenNeeded = tokenTransfer + allowanceTokenTransfer
  if (ethNeeded > safeEth) {
    const shortfall = ethNeeded - safeEth
    if (v['no-fund'])
      throw new CliError(
        `Safe needs ${formatEther(shortfall)} more ETH for the demo transfers (--no-fund set)`
      )
    const signerEth = await client.getBalance({ address: sender })
    if (signerEth <= shortfall) {
      throw new CliError(
        `signer has ${formatEther(signerEth)} ETH, needs ${formatEther(shortfall)} plus gas to fund the Safe`
      )
    }
    steps.push({
      kind: 'tx',
      label: `fund Safe with ${formatEther(shortfall)} ETH`,
      to: safe,
      data: '0x',
      value: shortfall
    })
  }
  if (token && tokenNeeded > safeToken) {
    const shortfall = tokenNeeded - safeToken
    const fmt = `${formatUnits(shortfall, token.decimals)} ${token.symbol}`
    if (v['no-fund'])
      throw new CliError(`Safe needs ${fmt} more for the demo transfers (--no-fund set)`)
    const signerToken = await erc20Balance(client, token.address, sender)
    if (signerToken < shortfall) {
      throw new CliError(
        `signer holds ${formatUnits(signerToken, token.decimals)} ${token.symbol} but ${fmt} is needed to fund the ` +
          'Safe for the demo token transfers: fund the signer, or pass --token-transfer 0 --allowance-token-transfer 0'
      )
    }
    steps.push({
      kind: 'tx',
      label: `fund Safe with ${fmt}`,
      to: token.address,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [safe, shortfall]
      }),
      value: 0n
    })
  }

  // The configuration batch: one MultiSend Safe transaction. `configureImmediately` must precede
  // `setGuard`/`setModuleGuard`, since the guard rejects it once it is installed on the Safe.
  if (!alreadyConfigured) {
    const batch: MetaTransactionData[] = []
    if (allowanceModule) {
      if (!moduleEnabled) {
        batch.push(
          call(
            safe,
            encodeFunctionData({
              abi: SAFE_ABI,
              functionName: 'enableModule',
              args: [allowanceModule]
            })
          )
        )
      }
      batch.push(
        call(
          allowanceModule,
          encodeFunctionData({
            abi: ALLOWANCE_MODULE_ABI,
            functionName: 'addDelegate',
            args: [delegate]
          })
        )
      )
      batch.push(
        call(
          allowanceModule,
          encodeFunctionData({
            abi: ALLOWANCE_MODULE_ABI,
            functionName: 'setAllowance',
            args: [delegate, zeroAddress, ethAllowance, Number(resetTimeMin), 0]
          })
        )
      )
      if (token) {
        batch.push(
          call(
            allowanceModule,
            encodeFunctionData({
              abi: ALLOWANCE_MODULE_ABI,
              functionName: 'setAllowance',
              args: [delegate, token.address, tokenAllowance, Number(resetTimeMin), 0]
            })
          )
        )
      }
    }
    batch.push(
      call(
        guard,
        encodeFunctionData({
          abi: GUARD_ABI,
          functionName: 'configureImmediately',
          args: [configurations]
        })
      )
    )
    batch.push(
      call(safe, encodeFunctionData({ abi: SAFE_ABI, functionName: 'setGuard', args: [guard] }))
    )
    batch.push(
      call(
        safe,
        encodeFunctionData({ abi: SAFE_ABI, functionName: 'setModuleGuard', args: [guard] })
      )
    )
    steps.push(
      await safeTx(
        sdk,
        sender,
        `configure ${configurations.length} policies + spending limits, install guard (${batch.length} calls via MultiSend)`,
        batch
      )
    )
  } else {
    console.log(`Safe ${safe} already has guard ${guard} installed: configuration batch skipped`)
  }

  // Demo transactions, all checked by the guard; a recipient is set whenever one is sent.
  if (recipient !== undefined && token && tokenTransfer > 0n) {
    steps.push(
      await safeTx(
        sdk,
        sender,
        `owner transfer ${formatUnits(tokenTransfer, token.decimals)} ${token.symbol} to ${recipient}`,
        [
          call(
            token.address,
            encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'transfer',
              args: [recipient, tokenTransfer]
            })
          )
        ]
      )
    )
  }
  if (recipient !== undefined && ethTransfer > 0n) {
    steps.push(
      await safeTx(sdk, sender, `owner transfer ${formatEther(ethTransfer)} ETH to ${recipient}`, [
        call(recipient, '0x', ethTransfer)
      ])
    )
  }
  const allowanceTransfers: { asset: Address; amount: bigint; label: string; limit: bigint }[] = []
  if (allowanceModule && allowanceEthTransfer > 0n) {
    allowanceTransfers.push({
      asset: zeroAddress,
      amount: allowanceEthTransfer,
      label: `${formatEther(allowanceEthTransfer)} ETH`,
      limit: ethAllowance
    })
  }
  if (allowanceModule && token && allowanceTokenTransfer > 0n) {
    allowanceTransfers.push({
      asset: token.address,
      amount: allowanceTokenTransfer,
      label: `${formatUnits(allowanceTokenTransfer, token.decimals)} ${token.symbol}`,
      limit: tokenAllowance
    })
  }
  for (const transfer of allowanceTransfers) {
    if (recipient === undefined) break
    let available = transfer.limit
    if (alreadyConfigured && allowanceModule) {
      const [amount, spent] = await client.readContract({
        address: allowanceModule,
        abi: ALLOWANCE_MODULE_ABI,
        functionName: 'getTokenAllowance',
        args: [safe, delegate, transfer.asset]
      })
      available = amount > spent ? amount - spent : 0n
    }
    if (transfer.amount > available) {
      console.warn(
        `! spending limit has ${available} left, below the ${transfer.label} demo transfer: skipped`
      )
      continue
    }
    steps.push({
      kind: 'tx',
      label: `delegate transfer ${transfer.label} to ${recipient} via Allowance Module (module guard)`,
      to: allowanceModule!,
      data: encodeFunctionData({
        abi: ALLOWANCE_MODULE_ABI,
        functionName: 'executeAllowanceTransfer',
        // An empty signature makes the module authenticate the delegate as msg.sender.
        args: [safe, transfer.asset, recipient, transfer.amount, zeroAddress, 0n, delegate, '0x']
      }),
      value: 0n
    })
  }

  // Post-conditions.
  const checks: Check[] = [
    storageCheck(safe, GUARD_STORAGE_SLOT, guard, 'transaction guard'),
    storageCheck(safe, MODULE_GUARD_STORAGE_SLOT, guard, 'module guard'),
    ...configurations.map((c) =>
      policyCheck(guard, safe, c.target, c.selector, c.operation, c.policy)
    )
  ]
  if (token) {
    for (const account of allowlist) {
      checks.push(
        permissionCheck(
          policies.ERC20_TRANSFER,
          'getRecipientPermission',
          guard,
          safe,
          token.address,
          account,
          permission
        ),
        permissionCheck(
          policies.ERC20_APPROVE,
          'getSpenderPermission',
          guard,
          safe,
          token.address,
          account,
          permission
        )
      )
    }
  }
  if (allowanceModule) {
    checks.push(moduleEnabledCheck(safe, allowanceModule))
    if (!alreadyConfigured) {
      checks.push(allowanceCheck(allowanceModule, safe, delegate, zeroAddress, ethAllowance))
      if (token)
        checks.push(allowanceCheck(allowanceModule, safe, delegate, token.address, tokenAllowance))
    }
  }

  const summary = {
    command: 'setup',
    chainId,
    safe,
    deployed: !exists,
    owners,
    threshold: 1,
    safeVersion: sdk.getContractVersion(),
    saltNonce: v.safe === undefined ? toHex(saltNonce) : undefined,
    singleton: v.safe === undefined ? (isL1SafeSingleton ? 'Safe (L1)' : 'SafeL2') : undefined,
    guard: { address: guard, delay: delay.toString(), expiry: expiry.toString() },
    allowanceModule,
    delegate: allowanceModule ? delegate : undefined,
    spendingLimits: allowanceModule
      ? {
          eth: formatEther(ethAllowance),
          token: token ? formatUnits(tokenAllowance, token.decimals) : undefined,
          resetTimeMin: Number(resetTimeMin)
        }
      : undefined,
    token: token?.address,
    allowlist,
    policies: configurations.map((c) => ({ ...c, policyKind: policyKind(policies, c.policy) }))
  }

  console.log(`\nSafe          ${safe}${exists ? '' : ' (will be deployed)'}`)
  console.log(`owners        ${owners.join(', ')} (threshold 1)`)
  console.log(`guard         ${guard} (DELAY ${delay}s, EXPIRY ${expiry}s)`)
  if (allowanceModule) console.log(`allowance     ${allowanceModule}, delegate ${delegate}`)
  if (token)
    console.log(`token         ${token.address} (${token.symbol}, ${token.decimals} decimals)`)
  console.log(`allowlist     ${allowlist.join(', ')}`)
  console.log('policies')
  for (const c of configurations) {
    console.log(
      `  ${policyKind(policies, c.policy).padEnd(15)} ${c.target} ${c.selector} ${c.operation === CALL ? 'CALL' : 'DELEGATECALL'}`
    )
  }

  return { title: `setup ${safe}`, steps, checks, summary }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// teardown
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type TeardownValues = ReturnType<typeof parseArgs<{ options: typeof TEARDOWN_OPTIONS }>>['values']

type GuardState = {
  guard: Address
  delay: bigint
  /** Access selector key -> configuration currently attached (non-zero policy). */
  active: Map<string, { target: Address; selector: Hex; operation: Operation; policy: Address }>
  /** Configurations that reset stateful policy permissions, applied before the zeroing entries. */
  resets: Configuration[]
  pendingRoots: Hex[]
}

async function planTeardown(ctx: Ctx, safeInput: Address, v: TeardownValues): Promise<Plan> {
  const { client, sender } = ctx
  const chainId = ctx.chain.id
  const safe = safeInput
  const policies = resolvePolicies(v.policy)
  const maxWait = parseBigInt(v['max-wait'], '--max-wait')
  console.log(`\n=== teardown ${safe} ===`)

  const sdk = await connectSafe(ctx, safe)
  const info = await readSafe(sdk)
  requireSafeVersion(info.version, safe, '1.')
  requireSoleSigner(info, safe, sender)
  console.log(
    `Safe v${info.version}, owners ${info.owners.join(', ')}, threshold ${info.threshold}`
  )
  console.log(`transaction guard ${info.guard}, module guard ${info.moduleGuard}`)

  // Every guard that may hold configuration for this Safe.
  const candidates = dedupe([
    ...Object.values(GUARDS_BY_DELAY),
    ...(EXTRA_TEARDOWN_GUARDS[chainId] ?? []),
    ...(v.guards !== undefined ? parseAddressList(v.guards, '--guards') : []),
    ...[info.guard, info.moduleGuard].filter((a) => a !== zeroAddress)
  ])
  const guards: { address: Address; delay: bigint }[] = []
  for (const address of candidates) {
    if (!(await hasCode(client, address))) continue
    const delay = await client
      .readContract({ address, abi: GUARD_ABI, functionName: 'DELAY' })
      .catch(() => undefined)
    if (delay === undefined) {
      if (address === info.guard || address === info.moduleGuard) {
        throw new CliError(
          `installed guard ${address} is not a SafePolicyGuard; remove it manually`
        )
      }
      continue
    }
    guards.push({ address, delay })
  }
  if (guards.length === 0) {
    console.log('no SafePolicyGuard deployments found on this chain')
  }

  const latest = await client.getBlockNumber()
  const fromBlock =
    v['from-block'] !== undefined
      ? parseBigInt(v['from-block'], '--from-block')
      : (GUARD_SCAN_FROM_BLOCK[chainId] ??
        (await firstDeploymentBlock(
          client,
          guards.map((g) => g.address),
          latest
        )))
  const logsRpcUrl = v['logs-rpc-url'] ?? envValue('LOGS_RPC_URL') ?? ctx.rpcUrl
  const logsClient =
    logsRpcUrl === ctx.rpcUrl
      ? client
      : (createPublicClient({
          transport: http(logsRpcUrl, { retryCount: 3, timeout: 60_000 })
        }) as PublicClient)
  if (logsClient !== client && (await logsClient.getChainId()) !== chainId) {
    throw new CliError(`--logs-rpc-url ${redactUrl(logsRpcUrl)} is not on chain ${chainId}`)
  }
  const logs = await scanGuardLogs(
    logsClient,
    guards.map((g) => g.address),
    safe,
    fromBlock,
    latest,
    parseBigInt(v['log-chunk'], '--log-chunk')
  )
  console.log(`scanned blocks ${fromBlock}..${latest}: ${logs.length} configuration events`)

  const states: GuardState[] = []
  for (const g of guards) {
    states.push(await reconstructGuardState(client, safe, g.address, g.delay, policies, logs))
  }

  for (const state of states) {
    if (state.active.size + state.resets.length + state.pendingRoots.length === 0) continue
    console.log(
      `guard ${state.guard} (delay ${state.delay}s): ${state.active.size} active, ` +
        `${state.resets.length} permission resets, ${state.pendingRoots.length} pending roots`
    )
    for (const c of state.active.values()) {
      console.log(
        `  ${policyKind(policies, c.policy).padEnd(15)} ${c.target} ${c.selector} ${c.operation === CALL ? 'CALL' : 'DELEGATECALL'}`
      )
    }
    for (const root of state.pendingRoots) console.log(`  pending root ${root}`)
  }

  const steps: Step[] = []
  let resumeNote: string | undefined
  let incomplete = false

  // 1. Remove the transaction guard. While it is installed every owner transaction is checked, so
  //    `setGuard(0)` needs a policy that allows it; if there is none, attach AllowPolicy through the
  //    guard's own delayed request/apply flow (always permitted to the Safe).
  if (info.guard !== zeroAddress) {
    const removeGuard = await safeTx(sdk, sender, `remove transaction guard ${info.guard}`, [
      meta(await sdk.createDisableGuardTx())
    ])
    const allowed = await client
      .call({ account: sender, to: removeGuard.to, data: removeGuard.data })
      .then(() => true)
      .catch(() => false)
    if (!allowed) {
      const state = states.find((s) => s.guard === info.guard)!
      const configuration: Configuration[] = [
        {
          target: safe,
          selector: SEL.setGuard,
          operation: CALL,
          policy: policies.ALLOW,
          data: '0x'
        }
      ]
      const root = configurationRoot(configuration)
      const now = (await client.getBlock()).timestamp
      const [validFrom, expiry] = await Promise.all([
        client.readContract({
          address: info.guard,
          abi: GUARD_ABI,
          functionName: 'rootConfigured',
          args: [safe, root]
        }),
        client.readContract({ address: info.guard, abi: GUARD_ABI, functionName: 'EXPIRY' })
      ])
      const pending = validFrom !== 0n && now < validFrom + expiry
      const remaining = pending ? (validFrom > now ? validFrom - now : 0n) : state.delay
      console.log(
        `setGuard(0) is not allowed by the guard: AllowPolicy will be attached via request/apply (delay ${state.delay}s)`
      )
      if (!pending) {
        steps.push(
          await safeTx(sdk, sender, `request configuration ${root} (AllowPolicy on setGuard)`, [
            call(
              info.guard,
              encodeFunctionData({
                abi: GUARD_ABI,
                functionName: 'requestConfiguration',
                args: [root]
              })
            )
          ])
        )
      } else {
        console.log(`configuration ${root} already requested, applicable at ${validFrom}`)
      }
      state.pendingRoots = state.pendingRoots.filter((r) => r !== root)
      if (remaining > maxWait) {
        incomplete = true
        resumeNote =
          `guard ${info.guard} needs ${remaining}s before the request can be applied (> --max-wait ${maxWait}s): ` +
          're-run this command once it has elapsed to finish the teardown'
      } else {
        if (remaining > 0n) {
          steps.push({
            kind: 'wait',
            label: `guard delay (${remaining}s)`,
            seconds: remaining,
            until: () =>
              client.readContract({
                address: info.guard,
                abi: GUARD_ABI,
                functionName: 'rootConfigured',
                args: [safe, root]
              })
          })
        }
        steps.push(
          await safeTx(sdk, sender, `apply configuration ${root}`, [
            call(
              info.guard,
              encodeFunctionData({
                abi: GUARD_ABI,
                functionName: 'applyConfiguration',
                args: [configuration]
              })
            )
          ])
        )
        state.active.set(accessKey(safe, SEL.setGuard, CALL), { ...configuration[0] })
        steps.push(removeGuard)
      }
    } else {
      steps.push(removeGuard)
    }
  }

  // 2. With no transaction guard, owner transactions are unchecked and `configureImmediately` is
  //    accepted again once the module guard is removed too: one batch removes the module guard,
  //    clears every policy on every guard and invalidates pending roots.
  const batch: MetaTransactionData[] = []
  if (!incomplete) {
    if (info.moduleGuard !== zeroAddress) {
      batch.push(meta(await sdk.createDisableModuleGuardTx()))
    }
    for (const state of states) {
      const clear: Configuration[] = [
        ...state.resets,
        ...[...state.active.values()].map((c) => ({ ...c, policy: zeroAddress, data: '0x' as Hex }))
      ]
      // Zero every access selector a reset touched (a reset re-attaches the policy to it).
      for (const reset of state.resets) {
        const key = accessKey(reset.target, reset.selector, reset.operation)
        if (!state.active.has(key)) {
          clear.push({ ...reset, policy: zeroAddress, data: '0x' })
          state.active.set(key, { ...reset })
        }
      }
      if (clear.length > 0) {
        batch.push(
          call(
            state.guard,
            encodeFunctionData({
              abi: GUARD_ABI,
              functionName: 'configureImmediately',
              args: [clear]
            })
          )
        )
      }
      for (const root of state.pendingRoots) {
        batch.push(
          call(
            state.guard,
            encodeFunctionData({ abi: GUARD_ABI, functionName: 'invalidateRoot', args: [root] })
          )
        )
      }
    }
    const cleared = states.reduce((n, s) => n + s.active.size, 0)
    const invalidated = states.reduce((n, s) => n + s.pendingRoots.length, 0)
    const label = [
      info.moduleGuard !== zeroAddress ? `remove module guard ${info.moduleGuard}` : undefined,
      cleared > 0 ? `clear ${cleared} policies` : undefined,
      invalidated > 0 ? `invalidate ${invalidated} pending roots` : undefined
    ]
      .filter((part) => part !== undefined)
      .join(', ')
    if (batch.length > 0) {
      const via = batch.length > 1 ? ` (${batch.length} calls via MultiSend)` : ''
      steps.push(await safeTx(sdk, sender, `${label}${via}`, batch))
    }
  }

  const checks: Check[] = incomplete
    ? []
    : [
        storageCheck(safe, GUARD_STORAGE_SLOT, zeroAddress, 'transaction guard'),
        storageCheck(safe, MODULE_GUARD_STORAGE_SLOT, zeroAddress, 'module guard'),
        ...states.flatMap((state) => [
          ...[...state.active.values()].map((c) =>
            policyCheck(state.guard, safe, c.target, c.selector, c.operation, zeroAddress)
          ),
          ...state.pendingRoots.map((root) => rootCheck(state.guard, safe, root)),
          ...state.resets.flatMap((reset) => resetChecks(policies, state.guard, safe, reset))
        ])
      ]

  return {
    title: `teardown ${safe}`,
    steps,
    checks,
    note: resumeNote,
    summary: {
      command: 'teardown',
      chainId,
      safe,
      complete: !incomplete,
      removedGuard: info.guard,
      removedModuleGuard: info.moduleGuard,
      guards: states.map((s) => ({
        guard: s.guard,
        cleared: [...s.active.values()],
        permissionResets: s.resets.length,
        invalidatedRoots: s.pendingRoots
      }))
    }
  }
}

/**
 * Replays a guard's `PolicyConfirmed` events for one Safe into the current configuration, and finds
 * the stateful permissions (ERC-20 recipients/spenders, allowed modules) still set in the policies:
 * clearing a guard entry does not clear a policy's own storage, which would resurface if the same
 * policy were attached again later.
 */
async function reconstructGuardState(
  client: PublicClient,
  safe: Address,
  guard: Address,
  delay: bigint,
  policies: Record<PolicyKind, Address>,
  logs: GuardLog[]
): Promise<GuardState> {
  const active: GuardState['active'] = new Map()
  const tokenAccounts = new Map<
    string,
    { policy: Address; token: Address; accounts: Set<Address> }
  >()
  const modules = new Map<Address, { target: Address; selector: Hex; operation: Operation }>()
  const roots = new Set<Hex>()

  for (const log of logs) {
    if (log.address !== guard) continue
    if (log.kind === 'RootConfigured') {
      roots.add(log.root)
      continue
    }
    const key = accessKey(log.target, log.selector, log.operation)
    if (log.policy === zeroAddress) active.delete(key)
    else
      active.set(key, {
        target: log.target,
        selector: log.selector,
        operation: log.operation,
        policy: log.policy
      })

    if (log.policy === policies.ERC20_TRANSFER || log.policy === policies.ERC20_APPROVE) {
      const decoded = tryDecode(() => decodeAbiParameters(RECIPIENT_LIST_PARAMS, log.data)[0])
      if (decoded === undefined) continue
      const entryKey = `${log.policy}|${log.target}`
      const entry = tokenAccounts.get(entryKey) ?? {
        policy: log.policy,
        token: log.target,
        accounts: new Set<Address>()
      }
      for (const item of decoded) entry.accounts.add(getAddress(item.account))
      tokenAccounts.set(entryKey, entry)
    } else if (log.policy === policies.ALLOWED_MODULE) {
      const decoded = tryDecode(() =>
        decodeAbiParameters([{ type: 'address' }, { type: 'bool' }], log.data)
      )
      if (decoded !== undefined) {
        modules.set(getAddress(decoded[0]), {
          target: log.target,
          selector: log.selector,
          operation: log.operation
        })
      }
    }
  }

  const resets: Configuration[] = []
  for (const entry of tokenAccounts.values()) {
    const isTransfer = entry.policy === policies.ERC20_TRANSFER
    const stillSet: Address[] = []
    for (const account of entry.accounts) {
      const permission = await client.readContract({
        address: entry.policy,
        abi: POLICY_ABI,
        functionName: isTransfer ? 'getRecipientPermission' : 'getSpenderPermission',
        args: [guard, safe, entry.token, account]
      })
      if (permission !== PERMISSION.none) stillSet.push(account)
    }
    if (stillSet.length > 0) {
      resets.push({
        target: entry.token,
        selector: isTransfer ? SEL.transfer : SEL.approve,
        operation: CALL,
        policy: entry.policy,
        data: encodeAbiParameters(RECIPIENT_LIST_PARAMS, [
          stillSet.map((account) => ({ account, permission: PERMISSION.none }))
        ])
      })
    }
  }
  for (const [module, access] of modules) {
    const allowed = await client.readContract({
      address: policies.ALLOWED_MODULE,
      abi: POLICY_ABI,
      functionName: 'isModuleAllowed',
      args: [guard, safe, module]
    })
    if (allowed) {
      resets.push({
        ...access,
        policy: policies.ALLOWED_MODULE,
        data: encodeAbiParameters([{ type: 'address' }, { type: 'bool' }], [module, false])
      })
    }
  }

  const pendingRoots: Hex[] = []
  for (const root of roots) {
    const validFrom = await client.readContract({
      address: guard,
      abi: GUARD_ABI,
      functionName: 'rootConfigured',
      args: [safe, root]
    })
    if (validFrom !== 0n) pendingRoots.push(root)
  }

  for (const c of active.values()) {
    const kind = policyKind(policies, c.policy)
    if (kind === 'COSIGNER' || kind === 'unknown') {
      console.warn(
        `! ${kind} policy ${c.policy} on guard ${guard}: its entry is cleared, its own storage is left as is`
      )
    }
  }
  return { guard, delay, active, resets, pendingRoots }
}

type GuardLog =
  | {
      kind: 'PolicyConfirmed'
      address: Address
      target: Address
      selector: Hex
      operation: Operation
      policy: Address
      data: Hex
    }
  | { kind: 'RootConfigured'; address: Address; root: Hex }

/** Fetches the guards' configuration events for `safe`, shrinking the block range on RPC errors. */
async function scanGuardLogs(
  client: PublicClient,
  guards: Address[],
  safe: Address,
  fromBlock: bigint,
  toBlock: bigint,
  initialChunk: bigint
): Promise<GuardLog[]> {
  if (guards.length === 0) return []
  const topics = [
    [
      toEventSelector('PolicyConfirmed(address,address,bytes4,uint8,address,bytes)'),
      toEventSelector('RootConfigured(address,bytes32,uint256)')
    ],
    padAddress(safe).toLowerCase() as Hex
  ]
  const result: GuardLog[] = []
  let chunk = initialChunk > 0n ? initialChunk : 50_000n
  for (let start = fromBlock; start <= toBlock; ) {
    const end = start + chunk - 1n > toBlock ? toBlock : start + chunk - 1n
    let raw: { address: Hex; topics: Hex[]; data: Hex }[]
    try {
      raw = (await client.request({
        method: 'eth_getLogs',
        params: [{ address: guards, topics, fromBlock: toHex(start), toBlock: toHex(end) }]
      } as never)) as { address: Hex; topics: Hex[]; data: Hex }[]
    } catch (error) {
      if (chunk <= 500n) {
        throw new CliError(
          `eth_getLogs failed for blocks ${start}..${end}: ${describeError(error)}. ` +
            'Use an RPC with full log history (--logs-rpc-url), or narrow the scan with --from-block'
        )
      }
      chunk /= 2n
      continue
    }
    for (const log of raw) {
      const event = decodeEventLog({
        abi: GUARD_ABI,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]]
      })
      const address = getAddress(log.address)
      if (event.eventName === 'PolicyConfirmed') {
        result.push({
          kind: 'PolicyConfirmed',
          address,
          target: getAddress(event.args.target),
          selector: event.args.selector,
          operation: event.args.operation as Operation,
          policy: getAddress(event.args.policy),
          data: event.args.data
        })
      } else if (event.eventName === 'RootConfigured') {
        result.push({ kind: 'RootConfigured', address, root: event.args.root })
      }
    }
    start = end + 1n
  }
  return result
}

/** Binary-searches the earliest block where any guard has code (needs an archive node). */
async function firstDeploymentBlock(
  client: PublicClient,
  guards: Address[],
  latest: bigint
): Promise<bigint> {
  if (guards.length === 0) return latest
  const deployedAt = async (blockNumber: bigint): Promise<boolean> => {
    for (const address of guards) {
      const code = await client.getCode({ address, blockNumber })
      if (code !== undefined && code !== '0x') return true
    }
    return false
  }
  try {
    let lo = 0n
    let hi = latest
    while (lo < hi) {
      const mid = (lo + hi) / 2n
      if (await deployedAt(mid)) hi = mid
      else lo = mid + 1n
    }
    return lo
  } catch {
    console.warn(
      '! RPC cannot read historical code: scanning events from block 0 (use --from-block to speed up)'
    )
    return 0n
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// exec
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type ExecValues = ReturnType<typeof parseArgs<{ options: typeof EXEC_OPTIONS }>>['values']

async function planExec(ctx: Ctx, v: ExecValues): Promise<Plan> {
  const safe = parseAddress(required(v.safe, '--safe'), '--safe')
  const to = parseAddress(required(v.to, '--to'), '--to')
  const value = parseAmount(v.value, 18, '--value')
  const data = v.data as Hex
  if (!isHex(data, { strict: true }) || data.length % 2 !== 0)
    throw new CliError('--data must be 0x-prefixed, even-length hex')
  const operation =
    v.operation === 'call' ? CALL : v.operation === 'delegatecall' ? DELEGATECALL : undefined
  if (operation === undefined) throw new CliError('--operation must be "call" or "delegatecall"')
  const sdk = await connectSafe(ctx, safe)
  const info = await readSafe(sdk)
  requireSafeVersion(info.version, safe, '1.')
  requireSoleSigner(info, safe, ctx.sender)
  console.log(`\nSafe ${safe} v${info.version}, guard ${info.guard}`)
  return {
    title: `exec ${safe}`,
    steps: [
      await safeTx(
        sdk,
        ctx.sender,
        `Safe tx to ${to} (value ${formatEther(value)} ETH, ${size(data)} bytes)`,
        [{ ...call(to, data, value), operation: operation as number as OperationType }]
      )
    ],
    checks: [],
    summary: {
      command: 'exec',
      chainId: ctx.chain.id,
      safe,
      to,
      value: value.toString(),
      data,
      operation
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Execution: dry-run simulation and live sending
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function runPlan(ctx: Ctx, plan: Plan, out?: string): Promise<Record<string, unknown>> {
  console.log(`\nplan: ${plan.title}`)
  if (plan.steps.length === 0) console.log('  nothing to send')
  plan.steps.forEach((step, i) =>
    console.log(`  ${i + 1}. ${step.kind === 'wait' ? `wait: ${step.label}` : step.label}`)
  )

  const summary: Record<string, unknown> = { ...plan.summary, dryRun: ctx.dryRun }
  if (ctx.dryRun) {
    summary.simulation = await simulate(ctx, plan)
  } else {
    if (plan.steps.length > 0) await confirm(ctx, plan)
    summary.transactions = await execute(ctx, plan)
    const failures = await runChecksLive(ctx, plan.checks)
    if (failures > 0) throw new CliError(`${failures} post-condition check(s) failed`)
    if (plan.checks.length > 0)
      console.log(`all ${plan.checks.length} post-condition checks passed`)
    if (plan.note !== undefined) console.log(`\nNOTE: ${plan.note}`)
  }
  if (out !== undefined) writeSummary(out, summary)
  return summary
}

async function confirm(ctx: Ctx, plan: Plan): Promise<void> {
  if (ctx.yes) return
  if (!process.stdin.isTTY)
    throw new CliError('refusing to send transactions without confirmation: pass --yes')
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(
    `\nSend ${plan.steps.filter((s) => s.kind === 'tx').length} transaction(s) on chain ${ctx.chain.id}? [y/N] `
  )
  rl.close()
  if (!/^y(es)?$/i.test(answer.trim())) throw new CliError('aborted')
}

async function execute(ctx: Ctx, plan: Plan): Promise<{ label: string; hash: Hex }[]> {
  const { client, wallet, account } = ctx
  const sent: { label: string; hash: Hex }[] = []
  let lastTimestamp = (await client.getBlock()).timestamp
  for (const [i, step] of plan.steps.entries()) {
    const n = `${i + 1}/${plan.steps.length}`
    if (step.kind === 'wait') {
      const until = step.until !== undefined ? await step.until() : lastTimestamp + step.seconds
      process.stdout.write(`[${n}] waiting until chain time ${until} (${step.label}) `)
      for (;;) {
        const now = (await client.getBlock()).timestamp
        if (now >= until) break
        process.stdout.write('.')
        await sleep(Math.min(Number(until - now), 12) * 1000)
      }
      console.log(' done')
      continue
    }
    process.stdout.write(`[${n}] ${step.label} ... `)
    let gas: bigint
    try {
      gas = await client.estimateGas({
        account: ctx.sender,
        to: step.to,
        data: step.data,
        value: step.value
      })
    } catch (error) {
      console.log('FAILED')
      throw new CliError(`gas estimation failed for "${step.label}": ${describeError(error)}`)
    }
    const hash = await wallet!.sendTransaction({
      account: account!,
      chain: ctx.chain,
      to: step.to,
      data: step.data,
      value: step.value,
      gas: (gas * 13n) / 10n
    })
    const receipt = await client.waitForTransactionReceipt({ hash, timeout: 300_000 })
    if (receipt.status !== 'success') {
      console.log('REVERTED')
      throw new CliError(`transaction ${hash} reverted ("${step.label}")`)
    }
    if (step.safe !== undefined && !hasExecutionSuccess(receipt.logs, step.safe)) {
      console.log('FAILED')
      throw new CliError(`Safe transaction ${hash} did not emit ExecutionSuccess ("${step.label}")`)
    }
    lastTimestamp = (await client.getBlock({ blockNumber: receipt.blockNumber })).timestamp
    console.log(`ok ${hash} (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`)
    sent.push({ label: step.label, hash })
  }
  return sent
}

async function runChecksLive(ctx: Ctx, checks: Check[]): Promise<number> {
  let failures = 0
  for (const check of checks) {
    const { data } = await ctx.client.call({ to: check.to, data: check.data })
    const error = check.verify(data ?? '0x')
    if (error !== undefined) {
      failures++
      console.log(`  ✗ ${check.label}: ${error}`)
    }
  }
  return failures
}

type SimCall = { from: Address; to: Address; data: Hex; value: Hex }
type SimResult = {
  status: Hex
  returnData: Hex
  gasUsed: Hex
  error?: { message?: string; data?: Hex }
}

/**
 * Simulates every step in order with `eth_simulateV1`, state carrying over from one step to the
 * next and the clock advanced over wait steps, then evaluates the post-condition checks against the
 * resulting state.
 */
async function simulate(ctx: Ctx, plan: Plan): Promise<Record<string, unknown>> {
  const { client, sender } = ctx
  const head = await client.getBlock()
  type SimBlock = { time: bigint; calls: SimCall[]; labels: string[] }
  const blocks: SimBlock[] = []
  let block: SimBlock = { time: head.timestamp + 12n, calls: [], labels: [] }
  for (const step of plan.steps) {
    if (step.kind === 'wait') {
      if (block.calls.length > 0) blocks.push(block)
      block = { time: block.time + step.seconds + 12n, calls: [], labels: [] }
      continue
    }
    block.calls.push({ from: sender, to: step.to, data: step.data, value: toHex(step.value) })
    block.labels.push(step.label)
  }
  if (block.calls.length > 0) blocks.push(block)
  const checkBlock: SimBlock = {
    time: (blocks.at(-1)?.time ?? head.timestamp) + 12n,
    calls: plan.checks.map((c) => ({ from: sender, to: c.to, data: c.data, value: '0x0' as Hex })),
    labels: plan.checks.map((c) => c.label)
  }
  const allBlocks = checkBlock.calls.length > 0 ? [...blocks, checkBlock] : blocks
  if (allBlocks.length === 0) return { steps: [], checks: [] }

  let results: { calls: SimResult[] }[]
  try {
    results = (await client.request({
      method: 'eth_simulateV1',
      params: [
        {
          blockStateCalls: allBlocks.map((b) => ({
            blockOverrides: { time: toHex(b.time) },
            calls: b.calls
          })),
          validation: false
        },
        'latest'
      ]
    } as never)) as { calls: SimResult[] }[]
  } catch (error) {
    throw new CliError(
      `eth_simulateV1 failed (the RPC may not support it, try another --rpc-url): ${describeError(error)}`
    )
  }

  console.log('\nsimulation:')
  let failed = 0
  let totalGas = 0n
  const stepResults: Record<string, unknown>[] = []
  blocks.forEach((b, bi) => {
    b.labels.forEach((label, ci) => {
      const r = results[bi].calls[ci]
      const gasUsed = BigInt(r.gasUsed)
      totalGas += gasUsed
      const ok = r.status === '0x1'
      if (!ok) failed++
      const reason = ok ? undefined : decodeRevert(r.error?.data ?? r.returnData, r.error?.message)
      console.log(
        `  ${ok ? '✓' : '✗'} ${label} (sim gas ${gasUsed})${ok ? '' : `\n      reverted: ${reason}`}`
      )
      stepResults.push({ label, success: ok, gasUsed: gasUsed.toString(), revert: reason })
    })
  })
  const checkResults: Record<string, unknown>[] = []
  let checkFailures = 0
  if (checkBlock.calls.length > 0) {
    const r = results[allBlocks.length - 1].calls
    plan.checks.forEach((check, i) => {
      const error =
        r[i].status === '0x1'
          ? check.verify(r[i].returnData)
          : `call reverted: ${decodeRevert(r[i].returnData)}`
      if (error !== undefined) {
        checkFailures++
        console.log(`  ✗ check ${check.label}: ${error}`)
      }
      checkResults.push({ label: check.label, ok: error === undefined, error })
    })
    if (checkFailures === 0) console.log(`  ✓ all ${plan.checks.length} post-condition checks pass`)
  }
  // eth_simulateV1 gas figures are upper bounds (no refunds, cold accesses), not cost estimates.
  console.log(`  simulated gas ${totalGas} (upper bound; live transactions use less)`)
  if (plan.note !== undefined) console.log(`\nNOTE: ${plan.note}`)
  if (failed > 0 || checkFailures > 0) {
    throw new CliError(
      `simulation failed: ${failed} step(s) reverted, ${checkFailures} check(s) failed`
    )
  }
  console.log('dry run OK: nothing was sent')
  return { steps: stepResults, checks: checkResults, totalGas: totalGas.toString() }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Safe helpers
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function call(to: Address, data: Hex, value = 0n): MetaTransactionData {
  return { to, value: value.toString(), data }
}

/** The call a protocol-kit `create*Tx` helper built, for batching with other calls. */
function meta(tx: SafeTransaction): MetaTransactionData {
  return { to: tx.data.to, value: tx.data.value, data: tx.data.data }
}

/**
 * A Safe `execTransaction` sent by `sender`: protocol-kit batches several calls through
 * MultiSendCallOnly and encodes the transaction (safeTxGas and gasPrice 0, as the guard requires, so
 * an inner revert reverts the whole transaction) with an owner pre-validated signature, which is
 * valid because the owner is msg.sender.
 */
async function safeTx(
  sdk: Safe,
  sender: Address,
  label: string,
  transactions: MetaTransactionData[]
): Promise<TxStep> {
  const tx = await sdk.createTransaction({ transactions, onlyCalls: true })
  tx.addSignature(generatePreValidatedSignature(sender))
  const safe = getAddress(await sdk.getAddress())
  return {
    kind: 'tx',
    label,
    to: safe,
    value: 0n,
    safe,
    data: (await sdk.getEncodedTransaction(tx)) as Hex
  }
}

async function connectSafe(ctx: Ctx, safe: Address): Promise<Safe> {
  if (!(await hasCode(ctx.client, safe))) {
    throw new CliError(`Safe ${safe} has no code on chain ${ctx.chain.id}`)
  }
  try {
    return await Safe.init({ provider: ctx.rpcUrl, safeAddress: safe })
  } catch (error) {
    throw new CliError(`${safe} is not a supported Safe: ${describeError(error)}`)
  }
}

type SafeInfo = {
  version: string
  owners: Address[]
  threshold: bigint
  guard: Address
  moduleGuard: Address
}

async function readSafe(sdk: Safe): Promise<SafeInfo> {
  const version = sdk.getContractVersion()
  const [owners, threshold, guard, moduleGuard] = await Promise.all([
    sdk.getOwners(),
    sdk.getThreshold(),
    // Transaction guards exist from v1.3.0 and module guards from v1.5.0.
    sdk.getGuard().catch(() => zeroAddress),
    version.startsWith('1.5') ? sdk.getModuleGuard() : Promise.resolve(zeroAddress)
  ])
  return {
    version,
    owners: owners.map((o) => getAddress(o)),
    threshold: BigInt(threshold),
    guard: getAddress(guard),
    moduleGuard: getAddress(moduleGuard)
  }
}

function requireSafeVersion(version: string, safe: Address, prefix: string): void {
  if (!version.startsWith(prefix)) {
    throw new CliError(
      `Safe ${safe} is v${version}; this command needs v${prefix}x${prefix === '1.5' ? ' (module guard support)' : ''}`
    )
  }
}

function requireSoleSigner(info: SafeInfo, safe: Address, sender: Address): void {
  if (!info.owners.includes(sender))
    throw new CliError(`signer ${sender} is not an owner of Safe ${safe}`)
  if (info.threshold !== 1n)
    throw new CliError(
      `Safe ${safe} has threshold ${info.threshold}; only threshold 1 is supported`
    )
}

function hasExecutionSuccess(
  logs: readonly { address: Address; topics: readonly Hex[] }[],
  safe: Address
): boolean {
  const topic = toEventSelector('ExecutionSuccess(bytes32,uint256)')
  return logs.some((log) => getAddress(log.address) === safe && log.topics[0] === topic)
}

function configurationRoot(configurations: Configuration[]): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'tuple[]', components: CONFIGURATION_COMPONENTS }],
      [configurations]
    )
  )
}

function accessKey(target: Address, selector: Hex, operation: Operation): string {
  return `${getAddress(target)}|${selector.toLowerCase()}|${operation}`
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Post-condition checks
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function storageCheck(safe: Address, slot: Hex, expected: Address, label: string): Check {
  return {
    label: `${label} is ${expected}`,
    to: safe,
    data: encodeFunctionData({
      abi: SAFE_ABI,
      functionName: 'getStorageAt',
      args: [BigInt(slot), 1n]
    }),
    verify: (ret) => {
      const word = decodeFunctionResult({ abi: SAFE_ABI, functionName: 'getStorageAt', data: ret })
      const actual = slotAddress(word)
      return actual === expected ? undefined : `found ${actual}`
    }
  }
}

function policyCheck(
  guard: Address,
  safe: Address,
  target: Address,
  selector: Hex,
  operation: Operation,
  expected: Address
): Check {
  // An empty calldata resolves to the 0x00000000 (native transfer) selector.
  const data = selector === SEL.native ? '0x' : selector
  return {
    label: `policy ${target} ${selector} op ${operation} is ${expected}`,
    to: guard,
    data: encodeFunctionData({
      abi: GUARD_ABI,
      functionName: 'getPolicy',
      args: [safe, target, data, operation]
    }),
    verify: (ret) => {
      const [, policy] = decodeFunctionResult({
        abi: GUARD_ABI,
        functionName: 'getPolicy',
        data: ret
      })
      return getAddress(policy) === expected ? undefined : `found ${policy}`
    }
  }
}

function permissionCheck(
  policy: Address,
  fn: 'getRecipientPermission' | 'getSpenderPermission',
  guard: Address,
  safe: Address,
  token: Address,
  account: Address,
  expected: number
): Check {
  return {
    label: `${fn}(${token}, ${account}) is ${expected}`,
    to: policy,
    data: encodeFunctionData({
      abi: POLICY_ABI,
      functionName: fn,
      args: [guard, safe, token, account]
    }),
    verify: (ret) => {
      const actual = decodeFunctionResult({ abi: POLICY_ABI, functionName: fn, data: ret })
      return actual === expected ? undefined : `found ${actual}`
    }
  }
}

function resetChecks(
  policies: Record<PolicyKind, Address>,
  guard: Address,
  safe: Address,
  reset: Configuration
): Check[] {
  if (reset.policy === policies.ALLOWED_MODULE) {
    const [module] = decodeAbiParameters([{ type: 'address' }, { type: 'bool' }], reset.data)
    return [
      {
        label: `module ${module} no longer allowed`,
        to: policies.ALLOWED_MODULE,
        data: encodeFunctionData({
          abi: POLICY_ABI,
          functionName: 'isModuleAllowed',
          args: [guard, safe, module]
        }),
        verify: (ret) =>
          decodeFunctionResult({ abi: POLICY_ABI, functionName: 'isModuleAllowed', data: ret })
            ? 'still allowed'
            : undefined
      }
    ]
  }
  const fn =
    reset.policy === policies.ERC20_TRANSFER ? 'getRecipientPermission' : 'getSpenderPermission'
  const [accounts] = decodeAbiParameters(RECIPIENT_LIST_PARAMS, reset.data)
  return accounts.map((a) =>
    permissionCheck(reset.policy, fn, guard, safe, reset.target, a.account, PERMISSION.none)
  )
}

function rootCheck(guard: Address, safe: Address, root: Hex): Check {
  return {
    label: `root ${root} is no longer pending`,
    to: guard,
    data: encodeFunctionData({
      abi: GUARD_ABI,
      functionName: 'rootConfigured',
      args: [safe, root]
    }),
    verify: (ret) => {
      const value = decodeFunctionResult({
        abi: GUARD_ABI,
        functionName: 'rootConfigured',
        data: ret
      })
      return value === 0n ? undefined : `still configured (${value})`
    }
  }
}

function moduleEnabledCheck(safe: Address, module: Address): Check {
  return {
    label: `module ${module} enabled`,
    to: safe,
    data: encodeFunctionData({ abi: SAFE_ABI, functionName: 'isModuleEnabled', args: [module] }),
    verify: (ret) =>
      decodeFunctionResult({ abi: SAFE_ABI, functionName: 'isModuleEnabled', data: ret })
        ? undefined
        : 'not enabled'
  }
}

function allowanceCheck(
  module: Address,
  safe: Address,
  delegate: Address,
  token: Address,
  expected: bigint
): Check {
  return {
    label: `spending limit ${delegate} / ${token} is ${expected}`,
    to: module,
    data: encodeFunctionData({
      abi: ALLOWANCE_MODULE_ABI,
      functionName: 'getTokenAllowance',
      args: [safe, delegate, token]
    }),
    verify: (ret) => {
      const [amount] = decodeFunctionResult({
        abi: ALLOWANCE_MODULE_ABI,
        functionName: 'getTokenAllowance',
        data: ret
      })
      return amount === expected ? undefined : `found ${amount}`
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function resolvePolicies(overrides: string[] | undefined): Record<PolicyKind, Address> {
  const policies = { ...DEFAULT_POLICIES }
  for (const entry of overrides ?? []) {
    const [kind, address] = entry.split('=')
    if (!(kind in policies) || address === undefined) {
      throw new CliError(
        `--policy expects KIND=address with KIND one of ${Object.keys(policies).join(', ')}`
      )
    }
    policies[kind as PolicyKind] = parseAddress(address, `--policy ${kind}`)
  }
  for (const kind of Object.keys(policies) as PolicyKind[])
    policies[kind] = getAddress(policies[kind])
  return policies
}

function policyKind(policies: Record<PolicyKind, Address>, policy: Address): string {
  const address = getAddress(policy)
  const match = (Object.keys(policies) as PolicyKind[]).find((kind) => policies[kind] === address)
  return match ?? LEGACY_POLICIES[address] ?? 'unknown'
}

/** Whether new Safes use the L1 `Safe` singleton rather than `SafeL2`. */
function resolveL1Singleton(value: string | undefined, chainId: number): boolean {
  if (value === undefined) return chainId === 1
  if (value === 'l1' || value === 'l2') return value === 'l1'
  throw new CliError('--singleton must be "l1" or "l2"')
}

function parseSafeCalls(value: string): string[] {
  const names = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  for (const name of names) {
    if (!(name in SAFE_CALLS)) {
      throw new CliError(
        `--allow-safe-calls: unknown "${name}", expected any of ${Object.keys(SAFE_CALLS).join(', ')}`
      )
    }
  }
  return [...new Set(names)]
}

function parseAddress(value: string, flag: string): Address {
  const trimmed = value.trim()
  if (!isAddress(trimmed, { strict: false }))
    throw new CliError(`${flag}: "${value}" is not an address`)
  const address = getAddress(trimmed)
  if (address === zeroAddress) throw new CliError(`${flag}: the zero address is not allowed`)
  return address
}

function parseAddressList(value: string, flag: string): Address[] {
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  if (list.length === 0) throw new CliError(`${flag}: expected at least one address`)
  return dedupe(list.map((s) => parseAddress(s, flag)))
}

function parseOptionalAddressList(value: string | undefined, flag: string): Address[] {
  return value === undefined ? [] : parseAddressList(value, flag)
}

function parseBigInt(value: string, flag: string): bigint {
  const trimmed = value.trim()
  if (!/^(0x[0-9a-fA-F]+|\d+)$/.test(trimmed))
    throw new CliError(`${flag}: "${value}" is not a non-negative integer`)
  return BigInt(trimmed)
}

function parseAmount(value: string, decimals: number, flag: string): bigint {
  const trimmed = value.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed))
    throw new CliError(`${flag}: "${value}" is not a non-negative amount`)
  const fraction = trimmed.split('.')[1] ?? ''
  if (fraction.length > decimals)
    throw new CliError(`${flag}: "${value}" has more than ${decimals} decimals`)
  return parseUnits(trimmed, decimals)
}

/** The trimmed value of an environment variable, or `undefined` when it is unset or blank. */
function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function requireEnvValue(name: string, purpose: string): string {
  const value = envValue(name)
  if (value === undefined) throw new CliError(`${name} is not set (${purpose}): see ${EXAMPLE_ENV}`)
  return value
}

function envAddressValue(name: string): Address | undefined {
  const value = envValue(name)
  return value === undefined ? undefined : parseAddress(value, name)
}

function required<T>(value: T | undefined, flag: string): T {
  if (value === undefined) throw new CliError(`${flag} is required`)
  return value
}

function dedupe(addresses: Address[]): Address[] {
  return [...new Set(addresses.map((a) => getAddress(a)))]
}

/** Left-pads an address to a 32-byte word. */
function padAddress(address: Address): Hex {
  return pad(address as Hex, { size: 32 })
}

function slotAddress(word: Hex | undefined): Address {
  if (word === undefined || word === '0x') return zeroAddress
  return getAddress(`0x${word.slice(-40)}`)
}

async function hasCode(client: PublicClient, address: Address): Promise<boolean> {
  const code = await client.getCode({ address })
  return code !== undefined && code !== '0x'
}

async function requireCode(client: PublicClient, address: Address, label: string): Promise<void> {
  if (!(await hasCode(client, address))) {
    throw new CliError(
      `${label} ${address} is not deployed on this chain (override it with the matching option)`
    )
  }
}

function erc20Balance(client: PublicClient, token: Address, account: Address): Promise<bigint> {
  return client.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account]
  })
}

function tryDecode<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

/** Decodes revert data into a readable reason, unwrapping `PolicyReverted` and Safe `GSxxx` codes. */
function decodeRevert(data: Hex | undefined, fallback?: string): string {
  if (data === undefined || data === '0x') return fallback ?? 'reverted without data'
  try {
    const decoded = decodeErrorResult({ abi: ERRORS_ABI as Abi, data })
    const args = (decoded.args ?? []) as unknown[]
    if (decoded.errorName === 'Error') {
      const message = String(args[0])
      return SAFE_ERROR_HINTS[message] !== undefined
        ? `${message}: ${SAFE_ERROR_HINTS[message]}`
        : message
    }
    if (decoded.errorName === 'ExecutionFailed' || decoded.errorName === 'ModuleExecutionFailed') {
      return `${decoded.errorName}(): the Safe's inner call failed (e.g. insufficient balance)`
    }
    if (decoded.errorName === 'PolicyReverted') {
      return `PolicyReverted(${args[0]}): ${decodeRevert(args[1] as Hex)}`
    }
    return `${decoded.errorName}(${args.map(String).join(', ')})`
  } catch {
    return `${data.slice(0, 74)}${data.length > 74 ? '…' : ''}`
  }
}

function describeError(error: unknown): string {
  const e = error as {
    shortMessage?: string
    message?: string
    cause?: { data?: Hex }
    walk?: (fn: (e: unknown) => boolean) => unknown
  }
  const raw = e.walk?.((inner) => typeof (inner as { data?: unknown }).data === 'string') as
    | { data?: Hex }
    | undefined
  if (raw?.data !== undefined && isHex(raw.data) && raw.data !== '0x') return decodeRevert(raw.data)
  return e.shortMessage ?? e.message ?? String(error)
}

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.length > 1 ? '/…' : ''}`
  } catch {
    return '<rpc>'
  }
}

function writeSummary(file: string, summary: unknown): void {
  writeFileSync(
    file,
    JSON.stringify(
      summary,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    ) + '\n'
  )
  console.log(`summary written to ${file}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error: unknown) => {
  const code = (error as { code?: unknown }).code
  if (
    error instanceof CliError ||
    (typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS'))
  ) {
    console.error(`\nerror: ${(error as Error).message}`)
  } else {
    console.error('\nunexpected error:', error)
  }
  process.exitCode = 1
})
