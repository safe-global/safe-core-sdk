import { ethers } from 'ethers'

const MAGIC_VALUE = '0x1626ba7e'

const EIP_1271_INTERFACE = new ethers.utils.Interface([
  'function isValidSignature(bytes32 _dataHash, bytes calldata _signature) external view'
])

export { EIP_1271_INTERFACE, MAGIC_VALUE }
