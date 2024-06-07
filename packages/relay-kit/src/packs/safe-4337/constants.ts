import { ethers } from 'ethers'

export const DEFAULT_SAFE_VERSION = '1.4.1'
export const DEFAULT_SAFE_MODULES_VERSION = '0.2.0'

export const EIP712_SAFE_OPERATION_TYPE = {
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

export const INTERFACES = new ethers.Interface([
  'function enableModules(address[])',
  'function multiSend(bytes memory transactions) public payable',
  'function executeUserOp(address to, uint256 value, bytes data, uint8 operation)',
  'function approve(address _spender, uint256 _value)'
])

export const ENTRYPOINT_ADDRESS_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
export const ENTRYPOINT_ADDRESS_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'

export const RPC_4337_CALLS = {
  ESTIMATE_USER_OPERATION_GAS: 'eth_estimateUserOperationGas',
  SEND_USER_OPERATION: 'eth_sendUserOperation',
  GET_USER_OPERATION_BY_HASH: 'eth_getUserOperationByHash',
  GET_USER_OPERATION_RECEIPT: 'eth_getUserOperationReceipt',
  SUPPORTED_ENTRY_POINTS: 'eth_supportedEntryPoints',
  CHAIN_ID: 'eth_chainId',
  SPONSOR_USER_OPERATION: 'pm_sponsorUserOperation'
}
