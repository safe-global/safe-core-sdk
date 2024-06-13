import {
  SafeUserOperation,
  OperationType,
  MetaTransactionData,
  SafeSignature,
  UserOperation
} from '@safe-global/safe-core-sdk-types'
import {
  EthSafeSignature,
  SafeProvider,
  encodeMultiSendData,
  buildSignatureBytes
} from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { EIP712_SAFE_OPERATION_TYPE, INTERFACES } from './constants'

/**
 * Gets the EIP-4337 bundler provider.
 *
 * @param {string} bundlerUrl The EIP-4337 bundler URL.
 * @return {Provider} The EIP-4337 bundler provider.
 */
export function getEip4337BundlerProvider(bundlerUrl: string): ethers.JsonRpcProvider {
  const provider = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
    batchMaxCount: 1
  })

  return provider
}

/**
 * Signs typed data.
 *
 * @param {SafeUserOperation} safeUserOperation - Safe user operation to sign.
 * @param {SafeProvider} safeProvider - Safe provider.
 * @param {string} safe4337ModuleAddress - Safe 4337 module address.
 * @return {Promise<SafeSignature>} The SafeSignature object containing the data and the signatures.
 */
export async function signSafeOp(
  safeUserOperation: SafeUserOperation,
  safeProvider: SafeProvider,
  safe4337ModuleAddress: string
): Promise<SafeSignature> {
  const signer = (await safeProvider.getExternalSigner()) as ethers.Signer
  const chainId = await safeProvider.getChainId()
  const signerAddress = await signer.getAddress()
  const signature = await signer.signTypedData(
    {
      chainId,
      verifyingContract: safe4337ModuleAddress
    },
    EIP712_SAFE_OPERATION_TYPE,
    {
      ...safeUserOperation,
      nonce: ethers.toBeHex(safeUserOperation.nonce),
      validAfter: ethers.toBeHex(safeUserOperation.validAfter),
      validUntil: ethers.toBeHex(safeUserOperation.validUntil),
      maxFeePerGas: ethers.toBeHex(safeUserOperation.maxFeePerGas),
      maxPriorityFeePerGas: ethers.toBeHex(safeUserOperation.maxPriorityFeePerGas)
    }
  )

  return new EthSafeSignature(signerAddress, signature)
}

/**
 * Encodes multi-send data from transactions batch.
 *
 * @param {MetaTransactionData[]} transactions - an array of transaction to to be encoded.
 * @return {string} The encoded data string.
 */
export function encodeMultiSendCallData(transactions: MetaTransactionData[]): string {
  return INTERFACES.encodeFunctionData('multiSend', [
    encodeMultiSendData(
      transactions.map((tx) => ({ ...tx, operation: tx.operation ?? OperationType.Call }))
    )
  ])
}

/**
 * Gets the safe user operation hash.
 *
 * @param {SafeUserOperation} safeUserOperation - The SafeUserOperation.
 * @param {bigint} chainId - The chain id.
 * @param {string} safe4337ModuleAddress - The Safe 4337 module address.
 * @return {string} The hash of the safe operation.
 */
export function calculateSafeUserOperationHash(
  safeUserOperation: SafeUserOperation,
  chainId: bigint,
  safe4337ModuleAddress: string
): string {
  return ethers.TypedDataEncoder.hash(
    {
      chainId,
      verifyingContract: safe4337ModuleAddress
    },
    EIP712_SAFE_OPERATION_TYPE,
    safeUserOperation
  )
}

/**
 * Converts various bigint values from a UserOperation to their hexadecimal representation.
 *
 * @param {UserOperation} userOperation - The UserOperation object whose values are to be converted.
 * @returns {UserOperation} A new UserOperation object with the values converted to hexadecimal.
 */
export function userOperationToHexValues(userOperation: UserOperation) {
  const userOperationWithHexValues = {
    ...userOperation,
    nonce: ethers.toBeHex(userOperation.nonce),
    callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
    verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
    preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
    maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
    maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
  }

  return userOperationWithHexValues
}

/**
 * Passkey Dummy client data JSON fields. This can be used for gas estimations, as it pads the fields enough
 * to account for variations in WebAuthn implementations.
 */
export const DUMMY_CLIENT_DATA_FIELDS = [
  `"origin":"https://safe.global"`,
  `"padding":"This pads the clientDataJSON so that we can leave room for additional implementation specific fields for a more accurate 'preVerificationGas' estimate."`
].join(',')

/**
 * Dummy authenticator data. This can be used for gas estimations, as it ensures that the correct
 * authenticator flags are set.
 */
export const DUMMY_AUTHENTICATOR_DATA = new Uint8Array(37)
// Authenticator data is the concatenation of:
// - 32 byte SHA-256 hash of the relying party ID
// - 1 byte for the user verification flag
// - 4 bytes for the signature count
// We fill it all with `0xfe` and set the appropriate user verification flag.
DUMMY_AUTHENTICATOR_DATA.fill(0xfe)
DUMMY_AUTHENTICATOR_DATA[32] = 0x04

/**
 * This method creates a dummy signature for the SafeOperation based on the Safe threshold. We assume that all owners are passkeys
 * This is useful for gas estimations
 * @param userOperation - The user operation
 * @param signer - The signer
 * @param threshold - The Safe threshold
 * @returns The user operation with the dummy passkey signature
 */
export function addDummySignature(
  userOperation: UserOperation,
  signer: string,
  threshold: number
): UserOperation {
  const signatures = []

  for (let i = 0; i < threshold; i++) {
    const isContractSignature = true
    const passkeySignature = getSignatureBytes({
      authenticatorData: DUMMY_AUTHENTICATOR_DATA,
      clientDataFields: DUMMY_CLIENT_DATA_FIELDS,
      r: BigInt(`0x${'ec'.repeat(32)}`),
      s: BigInt(`0x${'d5a'.repeat(21)}f`)
    })

    signatures.push(new EthSafeSignature(signer, passkeySignature, isContractSignature))
  }

  return {
    ...userOperation,
    signature: ethers.solidityPacked(
      ['uint48', 'uint48', 'bytes'],
      [0, 0, buildSignatureBytes(signatures)]
    )
  }
}

/**
 * Encodes the given WebAuthn signature into a string. This computes the ABI-encoded signature parameters:
 * ```solidity
 * abi.encode(authenticatorData, clientDataFields, r, s);
 * ```
 *
 * @param authenticatorData - The authenticator data as a Uint8Array.
 * @param clientDataFields - The client data fields as a string.
 * @param r - The value of r as a bigint.
 * @param s - The value of s as a bigint.
 * @returns The encoded string.
 */
export function getSignatureBytes({
  authenticatorData,
  clientDataFields,
  r,
  s
}: {
  authenticatorData: Uint8Array
  clientDataFields: string
  r: bigint
  s: bigint
}): string {
  // Helper functions
  // Convert a number to a 64-byte hex string with padded upto Hex string with 32 bytes
  const encodeUint256 = (x: bigint | number) => x.toString(16).padStart(64, '0')
  // Calculate the byte size of the dynamic data along with the length parameter alligned to 32 bytes
  const byteSize = (data: Uint8Array) => 32 * (Math.ceil(data.length / 32) + 1) // +1 is for the length parameter
  // Encode dynamic data padded with zeros if necessary in 32 bytes chunks
  const encodeBytes = (data: Uint8Array) =>
    `${encodeUint256(data.length)}${ethers.hexlify(data).slice(2)}`.padEnd(byteSize(data) * 2, '0')

  // authenticatorData starts after the first four words.
  const authenticatorDataOffset = 32 * 4
  // clientDataFields starts immediately after the authenticator data.
  const clientDataFieldsOffset = authenticatorDataOffset + byteSize(authenticatorData)

  return (
    '0x' +
    encodeUint256(authenticatorDataOffset) +
    encodeUint256(clientDataFieldsOffset) +
    encodeUint256(r) +
    encodeUint256(s) +
    encodeBytes(authenticatorData) +
    encodeBytes(new TextEncoder().encode(clientDataFields))
  )
}
