import { ethers } from 'ethers'

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

// TODO: Use Safe modules deployments and Safe deployments
export const SAFE_ADDRESSES_MAP = {
  ADD_MODULES_LIB_ADDRESS: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
  SAFE_4337_MODULE_ADDRESS: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
  SAFE_PROXY_FACTORY_ADDRESS: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
  SAFE_SINGLETON_ADDRESS: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
  MULTISEND_ADDRESS: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
  MULTISENDCALLONLY_ADDRESS: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2'
} as const

export const INTERFACES = new ethers.Interface([
  'function enableModules(address[])',
  'function multiSend(bytes memory transactions) public payable',
  'function executeUserOp(address to, uint256 value, bytes data, uint8 operation)'
])

export const RPC_4337_CALLS = {
  ESTIMATE_USER_OPERATION_GAS: 'eth_estimateUserOperationGas',
  SEND_USER_OPERATION: 'eth_sendUserOperation',
  GET_USER_OPERATION_BY_HASH: 'eth_getUserOperationByHash',
  GET_USER_OPERATION_RECEIPT: 'eth_getUserOperationReceipt',
  SUPPORTED_ENTRY_POINTS: 'eth_supportedEntryPoints',
  CHAIN_ID: 'eth_chainId'
}
