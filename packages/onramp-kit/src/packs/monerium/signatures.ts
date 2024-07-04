import { parseAbi } from 'viem'

// EIP-1271 magic values (https://eips.ethereum.org/EIPS/eip-1271)
// The four-byte code is defined as follows:
// - 0x00000000 if the signature is invalid.
// - 0x20c13b0b if the signature is valid and was produced using the eth_sign method.
// - 0x1626ba7e if the signature is valid and was produced using the personal_sign method.

// More info: https://docs.safe.global/safe-core-protocol/signatures/eip-1271
const MAGIC_VALUE = '0x1626ba7e'
const MAGIC_VALUE_BYTES = '0x20c13b0b'

const EIP_1271_ABI = parseAbi([
  'function isValidSignature(bytes32 _dataHash, bytes calldata _signature) external view'
])
const EIP_1271_BYTES_ABI = parseAbi([
  'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view'
])

export { EIP_1271_BYTES_ABI, EIP_1271_ABI, MAGIC_VALUE, MAGIC_VALUE_BYTES }
