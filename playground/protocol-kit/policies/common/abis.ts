// SPDX-License-Identifier: FSL-1.1-MIT

/**
 * ABIs of the contracts the policy scripts call. The Safe and guard ABIs carry the guard errors, so
 * a reverted simulation decodes to its cause.
 */

import { type Abi, parseAbi, parseAbiItem } from 'viem';

/** Errors any guarded call can revert with: the SafePolicyGuard's own, and those of its policies. */
export const GUARD_ERRORS_ABI = parseAbi([
  // SafePolicyGuard / PolicyEngine
  'error AccessDenied(address policy)',
  'error PolicyReverted(address policy, bytes reason)',
  'error GuardTargetDenied()',
  'error NonZeroGasPrice()',
  'error NonZeroSafeTxGas()',
  'error RootAlreadyConfigured(bytes32 root)',
  'error RootNotConfigured(bytes32 root)',
  'error RootConfigurationPending()',
  'error RootConfigurationExpired()',
  'error GuardAlreadyEnabled()',
  'error ExecutionFailed()',
  'error ModuleExecutionFailed()',
  'error Reentrancy()',
  'error NotChecking()',
  'error CrossSafeCheck()',
  'error ModuleConfigurationDenied()',
  'error InvalidSelector()',
  'error PolicyConfigurationFailed()',
  // Policies
  'error Unauthorized()',
  'error InvalidTransfer()',
  'error InvalidOperation()',
  'error CalldataNotPermitted()',
  'error InvalidApproval()',
  'error UnauthorizedModule()',
  'error InvalidModule()',
  'error InvalidMultiSend()',
]);

export const SAFE_ABI = [
  ...parseAbi([
    'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool)',
    'function getOwners() view returns (address[])',
    'function getThreshold() view returns (uint256)',
    'function nonce() view returns (uint256)',
    'function VERSION() view returns (string)',
    'function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)',
    'function getStorageAt(uint256 offset, uint256 length) view returns (bytes)',
    'function setup(address[] owners, uint256 threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)',
    'function enableModule(address module)',
    'function disableModule(address prevModule, address module)',
    'function setGuard(address guard)',
    'function setModuleGuard(address moduleGuard)',
    'event ExecutionFailure(bytes32 indexed txHash, uint256 payment)',
  ]),
  ...GUARD_ERRORS_ABI,
] as const satisfies Abi;

/** `Configuration[]` of SafePolicyGuard: one binding of a policy to an access. */
const CONFIGURATIONS_TUPLE = '(address target, bytes4 selector, uint8 operation, address policy, bytes data)[]';

export const GUARD_ABI = [
  ...parseAbi([
    `function configureImmediately(${CONFIGURATIONS_TUPLE} configurations)`,
    `function applyConfiguration(${CONFIGURATIONS_TUPLE} configurations)`,
    'function requestConfiguration(bytes32 configureRoot)',
    'function invalidateRoot(bytes32 configureRoot)',
    'function rootConfigured(address safe, bytes32 root) view returns (uint256)',
    'function DELAY() view returns (uint256)',
    'function EXPIRY() view returns (uint256)',
    'function getPolicy(address safe, address to, bytes data, uint8 operation) view returns (uint256 access, address policy)',
  ]),
  ...GUARD_ERRORS_ABI,
] as const satisfies Abi;

/** A policy bound to an access; a zero `policy` removes the binding. */
export const POLICY_CONFIRMED_EVENT = parseAbiItem(
  'event PolicyConfirmed(address indexed safe, address indexed target, bytes4 selector, uint8 operation, address policy, bytes data)',
);

/** A root requested with `requestConfiguration`. */
export const ROOT_CONFIGURED_EVENT = parseAbiItem(
  'event RootConfigured(address indexed safe, bytes32 indexed root, uint256 timestamp)',
);

export const PROXY_FACTORY_ABI = parseAbi([
  'function proxyCreationCode() pure returns (bytes)',
  'function createProxyWithNonce(address singleton, bytes initializer, uint256 saltNonce) returns (address proxy)',
]);

export const MULTISEND_ABI = parseAbi(['function multiSend(bytes transactions) payable']);

export const ALLOWANCE_MODULE_ABI = parseAbi([
  'function addDelegate(address delegate)',
  'function removeDelegate(address delegate, bool removeAllowances)',
  'function setAllowance(address delegate, address token, uint96 allowanceAmount, uint16 resetTimeMin, uint32 resetBaseMin)',
  'function getDelegates(address safe, uint48 start, uint8 pageSize) view returns (address[] results, uint48 next)',
  'function getTokens(address safe, address delegate) view returns (address[])',
  'function getTokenAllowance(address safe, address delegate, address token) view returns (uint256[5])',
  'function executeAllowanceTransfer(address safe, address token, address to, uint96 amount, address paymentToken, uint96 payment, address delegate, bytes signature)',
]);

export const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);
