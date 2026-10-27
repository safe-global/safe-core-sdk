// SPDX-License-Identifier: FSL-1.1-MIT
// biome-ignore-all lint/suspicious/noConsole: CLI script - console is the intended output.

/**
 * Sets up (and sweeps) a Sepolia Safe v1.5.0 that carries one of every guard
 * policy kind CGW reports, for testing the policies API end to end.
 *
 * SETUP - `node playground/protocol-kit/policies/showcase-safe.ts setup`
 *   1. Deploys a 1-of-2 Safe: the signer and CO_OWNER.
 *   2. In one MultiSend batch: sets the 5-second SafePolicyGuard as both the
 *      module guard and the transaction guard, and requests the policy
 *      configuration (`requestConfiguration(root)`).
 *   3. Waits out the guard's delay, then applies the configuration.
 *   4. Funds the Safe with the test token and a little Sepolia ETH.
 *
 * SWEEP - `node playground/protocol-kit/policies/showcase-safe.ts sweep`
 *   1. Sends the Safe's tokens and ETH back to CO_OWNER (the policies allow it).
 *   2. Removes every binding, keeping only ALLOW on the two guard setters.
 *   3. Unsets the module guard and the transaction guard.
 *   4. Removes the last two bindings with `configureImmediately`, which the
 *      guard accepts once it is no longer installed.
 *
 * SPACE - `node playground/protocol-kit/policies/showcase-safe.ts space`
 *   Signs in to the CGW at CGW_URL (e.g. a local one) with SIWE,
 *   registers the signer as a user, reuses or creates the "policy showcase"
 *   Space, adds the Safe to it, and prints a curl for its active policies.
 *
 * Every step is skipped when already done, so a run can be repeated safely.
 *
 * ANOTHER SAFE WITH THE SAME SETUP: the Safe address is derived from the salt
 * nonce, so pass a different one (the default is 1001):
 *   node playground/protocol-kit/policies/showcase-safe.ts setup --salt-nonce 1002
 *   node playground/protocol-kit/policies/showcase-safe.ts sweep --salt-nonce 1002
 *
 * Every Safe transaction is executed directly by the signer, an owner of a
 * threshold-1 Safe, so no Transaction Service or co-signer is involved.
 *
 * Settings come from the environment (see playground/protocol-kit/.example.env): PRIVATE_KEY,
 * RPC_URL (a Sepolia endpoint), CO_OWNER, TRUSTED_ADDRESS, TEST_TOKEN, and CGW_URL for `space`:
 *   node --env-file-if-exists=playground/protocol-kit/.env \
 *        playground/protocol-kit/policies/showcase-safe.ts setup
 */
import { parseArgs } from 'node:util';
import {
  type Address,
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  type Hex,
  http,
  keccak256,
  pad,
  parseEther,
  parseUnits,
  toFunctionSelector,
  zeroAddress,
} from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ERC20_ABI, GUARD_ABI, PROXY_FACTORY_ABI, SAFE_ABI } from './common/abis.ts';
import { coOwner, signerAccount, trustedAddress } from './common/accounts.ts';
import { ConfigError, requireEnv, requireEnvAddress } from './common/config.ts';
import { LEGACY_GUARDS, LEGACY_POLICY_CONTRACTS, POLICY_CONTRACTS, SAFE_V150 } from './common/deployments.ts';
import { createGatewayClient, defaultGatewayUrl, type GatewayClient, spaceHoldsSafe } from './common/gateway.ts';
import {
  type AllowlistEntry,
  CGW_POLICY_TYPES,
  type Configuration,
  configurationRoot,
  encodeAllowlist,
  NO_SELECTOR,
} from './common/policies.ts';
import {
  CALL,
  DELEGATECALL,
  encodeMultiSend,
  MODULE_GUARD_STORAGE_SLOT,
  type Operation,
  preValidatedSignature,
  TRANSACTION_GUARD_STORAGE_SLOT,
} from './common/safe.ts';
import { sleep, waitForBlockTimestamp } from './common/time.ts';

// ─── Fixed inputs ───────────────────────────────────────────────────────────

const DEFAULT_SALT_NONCE = 1001n;

const FUND_TOKENS = parseUnits('1000', 18);
const FUND_ETH = parseEther('0.001');

/** The SafePolicyGuard deployed with `delay = 5` seconds, which this showcase was built on. */
const GUARD = LEGACY_GUARDS[5];

/**
 * The policy contracts the showcase binds: the deployments current when it was built, so `sweep`
 * unbinds exactly what `setup` bound.
 */
const POLICY = {
  ...POLICY_CONTRACTS,
  cosigner: LEGACY_POLICY_CONTRACTS.cosigner,
  nativeTransfer: LEGACY_POLICY_CONTRACTS.nativeTransfer,
};

const SPACE_NAME = 'policy showcase';

// ─── Environment ────────────────────────────────────────────────────────────

/** Settings from the environment, resolved by {@link loadSettings} before any command runs. */
let RPC_URL: string;
let CO_OWNER: Address;
let TRUSTED_ADDRESS: Address;
let TEST_TOKEN: Address;
/** Only `space` talks to a gateway, so only it requires CGW_URL. */
let gateway: GatewayClient;

function loadSettings(command: Command): void {
  RPC_URL = requireEnv('RPC_URL', 'a Sepolia JSON-RPC endpoint');
  CO_OWNER = coOwner();
  TRUSTED_ADDRESS = trustedAddress();
  TEST_TOKEN = requireEnvAddress('TEST_TOKEN', 'the ERC-20 the token policies allowlist');
  if (command === 'space') {
    gateway = createGatewayClient(defaultGatewayUrl());
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

type SafeTransaction = {
  to: Address;
  data: Hex;
  value?: bigint;
  operation?: Operation;
};

type Context = {
  signer: PrivateKeyAccount;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  safe: Address;
  saltNonce: bigint;
};

// ─── Policy configuration ───────────────────────────────────────────────────

function binding(
  target: Address,
  signature: string | null,
  policy: Address,
  data: Hex = '0x',
  operation: Operation = CALL,
): Configuration {
  const selector = signature ? toFunctionSelector(signature) : NO_SELECTOR;
  return { target, selector, operation, policy, data };
}

/** One binding of every guard policy kind CGW reports, plus ERC-20 approve. */
function showcaseConfigurations(
  safe: Address,
  signer: Address,
): Array<Configuration> {
  return [
    ...tokenBindings(signer),
    ...nativeTransferBindings(signer),
    ...multiSendBindings(),
    ...safeCallBindings(safe),
  ];
}

/**
 * ERC20_TRANSFER: one recipient list per token, shared by `transfer` and
 * `transferFrom`. ERC20_APPROVE: a spender list - CGW does not report it yet.
 */
function tokenBindings(signer: Address): Array<Configuration> {
  const recipients: Array<AllowlistEntry> = [
    { address: CO_OWNER, permission: 'always' },
    { address: signer, permission: 'always' },
    { address: TRUSTED_ADDRESS, permission: 'once' },
  ];
  const spenders: Array<AllowlistEntry> = [
    { address: CO_OWNER, permission: 'always' },
    { address: TRUSTED_ADDRESS, permission: 'once' },
  ];
  const recipientList = encodeAllowlist(recipients);
  return [
    binding(TEST_TOKEN, 'function transfer(address,uint256)', POLICY.erc20Transfer, recipientList),
    binding(TEST_TOKEN, 'function transferFrom(address,address,uint256)', POLICY.erc20Transfer, recipientList),
    binding(TEST_TOKEN, 'function approve(address,uint256)', POLICY.erc20Approve, encodeAllowlist(spenders)),
  ];
}

/**
 * NATIVE_TRANSFER is stateless: each allowed recipient is its own binding,
 * targeting the recipient with no selector.
 */
function nativeTransferBindings(signer: Address): Array<Configuration> {
  return [CO_OWNER, signer, TRUSTED_ADDRESS].map((recipient) =>
    binding(recipient, null, POLICY.nativeTransfer),
  );
}

/** MULTISEND: checks every transaction of a batch against the guard. */
function multiSendBindings(): Array<Configuration> {
  return [SAFE_V150.multiSendCallOnly, SAFE_V150.multiSend].map((target) =>
    binding(target, 'function multiSend(bytes)', POLICY.multiSend, '0x', DELEGATECALL),
  );
}

/**
 * Calls to the Safe itself: ALLOW owner management, so the owners can still
 * change; DENY `enableModule`; COSIGNER on `setFallbackHandler`, co-signed by
 * CO_OWNER.
 */
function safeCallBindings(safe: Address): Array<Configuration> {
  const ownerManagement = [
    'function addOwnerWithThreshold(address,uint256)',
    'function removeOwner(address,address,uint256)',
    'function swapOwner(address,address,address)',
    'function changeThreshold(uint256)',
  ];
  const cosigner = encodeAbiParameters([{ type: 'address' }], [CO_OWNER]);
  return [
    ...ownerManagement.map((signature) => binding(safe, signature, POLICY.allow)),
    binding(safe, 'function enableModule(address)', POLICY.deny),
    binding(safe, 'function setFallbackHandler(address)', POLICY.cosigner, cosigner),
  ];
}

/** ALLOW on the two guard setters: what the sweep needs to unset the guards. */
function guardSetterBindings(safe: Address): Array<Configuration> {
  return [
    binding(safe, 'function setGuard(address)', POLICY.allow),
    binding(safe, 'function setModuleGuard(address)', POLICY.allow),
  ];
}

/** The same accesses with no policy: the guard deletes a binding bound to zero. */
function unbound(configurations: Array<Configuration>): Array<Configuration> {
  return configurations.map((configuration) => ({
    ...configuration,
    policy: zeroAddress,
    data: '0x',
  }));
}

// ─── Chain plumbing ─────────────────────────────────────────────────────────

function createContext(
  signer: PrivateKeyAccount,
  saltNonce: bigint,
): Omit<Context, 'safe'> {
  return {
    signer,
    saltNonce,
    publicClient: createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    }),
    walletClient: createWalletClient({
      account: signer,
      chain: sepolia,
      transport: http(RPC_URL),
    }),
  };
}

function safeInitializer(signer: Address): Hex {
  return encodeFunctionData({
    abi: SAFE_ABI,
    functionName: 'setup',
    args: [
      [signer, CO_OWNER],
      1n,
      zeroAddress,
      '0x',
      SAFE_V150.fallbackHandler,
      zeroAddress,
      0n,
      zeroAddress,
    ],
  });
}

/** The proxy factory's CREATE2 address for this signer and salt nonce. */
async function predictSafeAddress(
  context: Omit<Context, 'safe'>,
): Promise<Address> {
  const creationCode = await context.publicClient.readContract({
    address: SAFE_V150.proxyFactory,
    abi: PROXY_FACTORY_ABI,
    functionName: 'proxyCreationCode',
  });
  const initializer = safeInitializer(context.signer.address);
  return getContractAddress({
    opcode: 'CREATE2',
    from: SAFE_V150.proxyFactory,
    salt: keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(initializer), context.saltNonce],
      ),
    ),
    bytecode: concat([creationCode, pad(SAFE_V150.singletonL2)]),
  });
}

/**
 * Sends a transaction and waits until the RPC serves the block it landed in:
 * the public RPC is load-balanced, and a node that has not seen the block yet
 * would estimate the next transaction against stale state.
 */
async function send(
  context: Context,
  label: string,
  request: { to: Address; data?: Hex; value?: bigint },
): Promise<void> {
  const hash = await context.walletClient.sendTransaction({
    ...request,
    account: context.signer,
    chain: sepolia,
  });
  const receipt = await context.publicClient.waitForTransactionReceipt({
    hash,
  });
  if (receipt.status !== 'success') {
    throw new Error(`${label} reverted: ${hash}`);
  }
  while ((await context.publicClient.getBlockNumber()) < receipt.blockNumber) {
    await sleep(1_000);
  }
  console.log(`  ✓ ${label}  ${hash}`);
}

/** Executes a Safe transaction as its threshold-1 owner. */
async function execute(
  context: Context,
  label: string,
  tx: SafeTransaction,
): Promise<void> {
  // `safeTxGas` and `gasPrice` must be 0 - the guard rejects anything else.
  const data = encodeFunctionData({
    abi: SAFE_ABI,
    functionName: 'execTransaction',
    args: [
      tx.to,
      tx.value ?? 0n,
      tx.data,
      tx.operation ?? CALL,
      0n,
      0n,
      0n,
      zeroAddress,
      zeroAddress,
      preValidatedSignature(context.signer.address),
    ],
  });
  await send(context, label, { to: context.safe, data });
}

/** One MultiSendCallOnly `DELEGATECALL` running {@link txs} in order. */
function multiSendBatch(txs: Array<SafeTransaction>): SafeTransaction {
  return {
    to: SAFE_V150.multiSendCallOnly,
    data: encodeMultiSend(
      txs.map((tx) => ({ to: tx.to, value: tx.value ?? 0n, data: tx.data, operation: CALL })),
    ),
    operation: DELEGATECALL,
  };
}

function guardCall(
  functionName:
    | 'requestConfiguration'
    | 'applyConfiguration'
    | 'configureImmediately',
  arg: Hex | Array<Configuration>,
): SafeTransaction {
  const data =
    functionName === 'requestConfiguration'
      ? encodeFunctionData({ abi: GUARD_ABI, functionName, args: [arg as Hex] })
      : encodeFunctionData({
          abi: GUARD_ABI,
          functionName,
          args: [arg as Array<Configuration>],
        });
  return { to: GUARD, data };
}

function setGuardCall(
  functionName: 'setGuard' | 'setModuleGuard',
  guard: Address,
  safe: Address,
): SafeTransaction {
  return {
    to: safe,
    data: encodeFunctionData({ abi: SAFE_ABI, functionName, args: [guard] }),
  };
}

async function guardOf(context: Context, slot: Hex): Promise<Address> {
  const word = await context.publicClient.getStorageAt({
    address: context.safe,
    slot,
  });
  return `0x${(word ?? '0x').slice(-40).padStart(40, '0')}`;
}

async function isBound(
  context: Context,
  configuration: Configuration,
): Promise<boolean> {
  const [, policy] = await context.publicClient.readContract({
    address: GUARD,
    abi: GUARD_ABI,
    functionName: 'getPolicy',
    args: [
      context.safe,
      configuration.target,
      configuration.selector,
      configuration.operation,
    ],
  });
  return policy.toLowerCase() === configuration.policy.toLowerCase();
}


// ─── Setup steps ────────────────────────────────────────────────────────────

async function deploySafe(context: Context): Promise<void> {
  const code = await context.publicClient.getCode({ address: context.safe });
  if (code && code !== '0x') {
    console.log('  • Safe already deployed');
    return;
  }
  const data = encodeFunctionData({
    abi: PROXY_FACTORY_ABI,
    functionName: 'createProxyWithNonce',
    args: [
      SAFE_V150.singletonL2,
      safeInitializer(context.signer.address),
      context.saltNonce,
    ],
  });
  await send(context, 'deploy Safe v1.5.0', {
    to: SAFE_V150.proxyFactory,
    data,
  });
}

/**
 * Sets both guards and requests the configuration in one MultiSend batch. The
 * Safe reads its guard before running a transaction, so this batch runs
 * unguarded even though it installs the guard.
 */
async function installGuardAndRequest(
  context: Context,
  configurations: Array<Configuration>,
): Promise<void> {
  if (
    (await guardOf(context, TRANSACTION_GUARD_STORAGE_SLOT)).toLowerCase() === GUARD.toLowerCase()
  ) {
    console.log('  • guards already set');
    return;
  }
  const batch = multiSendBatch([
    setGuardCall('setModuleGuard', GUARD, context.safe),
    setGuardCall('setGuard', GUARD, context.safe),
    guardCall('requestConfiguration', configurationRoot(configurations)),
  ]);
  await execute(
    context,
    'set module guard + transaction guard, request configuration',
    batch,
  );
}

/**
 * Applies {@link configurations} through the guard's delay: requests the root
 * unless it already is, waits until it is ready, then applies it.
 */
async function requestAndApply(
  context: Context,
  label: string,
  configurations: Array<Configuration>,
): Promise<void> {
  const root = configurationRoot(configurations);
  let readyAt = await readyTime(context, root);
  if (readyAt === 0n) {
    await execute(
      context,
      `request ${label}`,
      guardCall('requestConfiguration', root),
    );
    readyAt = await readyTime(context, root);
  }
  await waitForBlockTimestamp(context.publicClient, readyAt, (secondsLeft) =>
    console.log(`  … waiting out the guard delay (${secondsLeft}s)`),
  );
  await execute(
    context,
    `apply ${label}`,
    guardCall('applyConfiguration', configurations),
  );
}

function readyTime(context: Context, root: Hex): Promise<bigint> {
  return context.publicClient.readContract({
    address: GUARD,
    abi: GUARD_ABI,
    functionName: 'rootConfigured',
    args: [context.safe, root],
  });
}

async function applyShowcase(
  context: Context,
  configurations: Array<Configuration>,
): Promise<void> {
  const applied = await Promise.all(
    configurations.map((c) => isBound(context, c)),
  );
  if (applied.every(Boolean)) {
    console.log(`  • all ${configurations.length} bindings already applied`);
    return;
  }
  await requestAndApply(
    context,
    `${configurations.length} policy bindings`,
    configurations,
  );
}

async function fundSafe(context: Context): Promise<void> {
  const [tokens, eth] = await Promise.all([
    context.publicClient.readContract({
      address: TEST_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [context.safe],
    }),
    context.publicClient.getBalance({ address: context.safe }),
  ]);
  if (tokens < FUND_TOKENS) {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [context.safe, FUND_TOKENS],
    });
    await send(context, 'fund 1000 TT', { to: TEST_TOKEN, data });
  }
  if (eth < FUND_ETH) {
    await send(context, 'fund 0.001 ETH', {
      to: context.safe,
      value: FUND_ETH,
    });
  }
  if (tokens >= FUND_TOKENS && eth >= FUND_ETH) {
    console.log('  • Safe already funded');
  }
}

async function setup(context: Context): Promise<void> {
  const configurations = showcaseConfigurations(
    context.safe,
    context.signer.address,
  );
  console.log('\n1. Safe');
  await deploySafe(context);
  console.log('\n2. Guards and configuration request');
  await installGuardAndRequest(context, configurations);
  console.log('\n3. Policies');
  await applyShowcase(context, configurations);
  console.log('\n4. Funds');
  await fundSafe(context);
}

// ─── Sweep steps ────────────────────────────────────────────────────────────

/** Sends the Safe's test tokens and ETH back to CO_OWNER, whom both policies allow. */
async function returnFunds(context: Context): Promise<void> {
  const [tokens, eth] = await Promise.all([
    context.publicClient.readContract({
      address: TEST_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [context.safe],
    }),
    context.publicClient.getBalance({ address: context.safe }),
  ]);
  if (tokens > 0n) {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [CO_OWNER, tokens],
    });
    await execute(context, 'return test tokens', { to: TEST_TOKEN, data });
  }
  if (eth > 0n) {
    // A plain value transfer: the NATIVE_TRANSFER binding of CO_OWNER allows it.
    await execute(context, 'return ETH', {
      to: CO_OWNER,
      data: '0x',
      value: eth,
    });
  }
  if (tokens === 0n && eth === 0n) {
    console.log('  • nothing to return');
  }
}

/** Unbinds every showcase policy, and binds ALLOW on the guard setters in the same root. */
async function unbindPolicies(context: Context): Promise<void> {
  const setters = guardSetterBindings(context.safe);
  if ((await guardOf(context, TRANSACTION_GUARD_STORAGE_SLOT)) === zeroAddress) {
    console.log('  • guard already unset');
    return;
  }
  if (await isBound(context, setters[0])) {
    console.log('  • policies already unbound');
    return;
  }
  const showcase = showcaseConfigurations(context.safe, context.signer.address);
  await requestAndApply(context, 'policy removal', [
    ...unbound(showcase),
    ...setters,
  ]);
}

/** Unsets the module guard first: once the transaction guard is gone, so is its ALLOW. */
async function unsetGuards(context: Context): Promise<void> {
  if ((await guardOf(context, MODULE_GUARD_STORAGE_SLOT)) !== zeroAddress) {
    await execute(
      context,
      'unset module guard',
      setGuardCall('setModuleGuard', zeroAddress, context.safe),
    );
  }
  if ((await guardOf(context, TRANSACTION_GUARD_STORAGE_SLOT)) !== zeroAddress) {
    await execute(
      context,
      'unset transaction guard',
      setGuardCall('setGuard', zeroAddress, context.safe),
    );
  }
}

/** `configureImmediately` is accepted once the guard is in neither slot. */
async function unbindGuardSetters(context: Context): Promise<void> {
  const setters = guardSetterBindings(context.safe);
  const bound = await Promise.all(setters.map((s) => isBound(context, s)));
  if (!bound.some(Boolean)) {
    console.log('  • no bindings left');
    return;
  }
  await execute(
    context,
    'remove the last bindings',
    guardCall('configureImmediately', unbound(setters)),
  );
}

async function sweep(context: Context): Promise<void> {
  console.log('\n1. Funds back to CO_OWNER');
  await returnFunds(context);
  console.log('\n2. Policies');
  await unbindPolicies(context);
  console.log('\n3. Guards');
  await unsetGuards(context);
  console.log('\n4. Remaining bindings');
  await unbindGuardSetters(context);
}

// ─── Space steps (local CGW) ────────────────────────────────────────────────

/** Registers the signer, then reuses the Space named SPACE_NAME or creates it. */
async function ensureSpace(token: string): Promise<string> {
  await gateway.registerUser(token);
  const existing = (await gateway.listSpaces(token)).find((space) => space.name === SPACE_NAME);
  if (existing) {
    console.log(`  • reusing Space "${SPACE_NAME}"`);
    return existing.uuid;
  }
  const spaceId = await gateway.createSpace(token, SPACE_NAME);
  console.log(`  ✓ created Space "${SPACE_NAME}"`);
  return spaceId;
}

async function addSafeToSpace(
  context: Context,
  token: string,
  spaceId: string,
): Promise<void> {
  const safe = { chainId: String(sepolia.id), address: context.safe };
  if (spaceHoldsSafe(await gateway.listSpaceSafes(token, spaceId), safe)) {
    console.log('  • Safe already in the Space');
    return;
  }
  await gateway.addSafesToSpace(token, spaceId, [safe]);
  console.log('  ✓ added the Safe to the Space');
}

async function space(context: Context): Promise<void> {
  console.log(`\n1. Sign in to ${gateway.url}`);
  const token = await gateway.signIn(context.signer, { chainId: sepolia.id });
  console.log(`  ✓ signed in as ${context.signer.address}`);
  console.log('\n2. Space');
  const spaceId = await ensureSpace(token);
  await addSafeToSpace(context, token, spaceId);
  const query = `types=${CGW_POLICY_TYPES.join(',')}&safes=${sepolia.id}:${context.safe}`;
  console.log(`\nActive policies of the Safe:\n
  curl -s '${gateway.url}/v1/spaces/${spaceId}/policies/active?${query}' \\
    -H 'Cookie: access_token=${token}' | jq`);
}

// ─── Entry point ────────────────────────────────────────────────────────────

type Command = 'setup' | 'sweep' | 'space';

function parseOptions(): {
  command: Command;
  saltNonce: bigint;
} {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'salt-nonce': { type: 'string' },
    },
  });
  const command = positionals[0] ?? 'setup';
  if (command !== 'setup' && command !== 'sweep' && command !== 'space') {
    throw new Error(
      `Unknown command ${JSON.stringify(command)}: use setup, sweep or space`,
    );
  }
  return {
    command,
    saltNonce: values['salt-nonce']
      ? BigInt(values['salt-nonce'])
      : DEFAULT_SALT_NONCE,
  };
}

async function main(): Promise<void> {
  const options = parseOptions();
  loadSettings(options.command);
  const base = createContext(signerAccount(), options.saltNonce);
  const chainId = await base.publicClient.getChainId();
  if (chainId !== sepolia.id) {
    throw new ConfigError(`RPC_URL is on chain ${chainId}; this showcase runs on Sepolia (${sepolia.id})`);
  }
  const context: Context = { ...base, safe: await predictSafeAddress(base) };

  console.log(
    `${options.command} - Safe ${context.safe} (salt nonce ${options.saltNonce})`,
  );
  console.log(
    `signer ${context.signer.address}, co-owner ${CO_OWNER}, guard ${GUARD}`,
  );

  const commands = { setup, sweep, space };
  await commands[options.command](context);

  console.log(`\nDone: https://app.safe.global/home?safe=sep:${context.safe}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof ConfigError ? `✗ ${error.message}` : error);
  process.exit(1);
});
