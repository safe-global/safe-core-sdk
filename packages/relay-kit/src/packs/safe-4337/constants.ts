import { parseAbi } from 'viem'

export const DEFAULT_SAFE_VERSION = '1.4.1'
export const DEFAULT_SAFE_MODULES_VERSION = '0.3.0'

export const EIP712_SAFE_OPERATION_TYPE_V06 = {
  SafeOp: [
    { type: 'address', name: 'safe' },
    { type: 'uint256', name: 'nonce' },
    { type: 'bytes', name: 'initCode' },
    { type: 'bytes', name: 'callData' },
    { type: 'uint256', name: 'callGasLimit' },
    { type: 'uint256', name: 'verificationGasLimit' },
    { type: 'uint256', name: 'preVerificationGas' },
    { type: 'uint256', name: 'maxFeePerGas' },
    { type: 'uint256', name: 'maxPriorityFeePerGas' },
    { type: 'bytes', name: 'paymasterAndData' },
    { type: 'uint48', name: 'validAfter' },
    { type: 'uint48', name: 'validUntil' },
    { type: 'address', name: 'entryPoint' }
  ]
}

export const EIP712_SAFE_OPERATION_TYPE_V07 = {
  SafeOp: [
    { type: 'address', name: 'safe' },
    { type: 'uint256', name: 'nonce' },
    { type: 'bytes', name: 'initCode' },
    { type: 'bytes', name: 'callData' },
    { type: 'uint128', name: 'verificationGasLimit' },
    { type: 'uint128', name: 'callGasLimit' },
    { type: 'uint256', name: 'preVerificationGas' },
    { type: 'uint128', name: 'maxPriorityFeePerGas' },
    { type: 'uint128', name: 'maxFeePerGas' },
    { type: 'bytes', name: 'paymasterAndData' },
    { type: 'uint48', name: 'validAfter' },
    { type: 'uint48', name: 'validUntil' },
    { type: 'address', name: 'entryPoint' }
  ]
}

export const ABI = parseAbi([
  'function enableModules(address[])',
  'function multiSend(bytes memory transactions) public payable',
  'function executeUserOp(address to, uint256 value, bytes data, uint8 operation)',
  'function approve(address _spender, uint256 _value)',
  'function configure((uint256 x, uint256 y, uint176 verifiers) signer)'
])

export const ENTRYPOINT_ABI = [
  {
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'key', type: 'uint192' }
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const ENTRYPOINT_ADDRESS_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
export const ENTRYPOINT_ADDRESS_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'

export enum RPC_4337_CALLS {
  ESTIMATE_USER_OPERATION_GAS = 'eth_estimateUserOperationGas',
  SEND_USER_OPERATION = 'eth_sendUserOperation',
  GET_USER_OPERATION_BY_HASH = 'eth_getUserOperationByHash',
  GET_USER_OPERATION_RECEIPT = 'eth_getUserOperationReceipt',
  SUPPORTED_ENTRY_POINTS = 'eth_supportedEntryPoints',
  CHAIN_ID = 'eth_chainId',
  GET_PAYMASTER_STUB_DATA = 'pm_getPaymasterStubData',
  GET_PAYMASTER_DATA = 'pm_getPaymasterData'
}
