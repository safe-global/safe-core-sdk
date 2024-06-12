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
 * This method creates a dummy signature for the SafeOperation based the owners.
 * This is useful for gas estimations
 * @param userOperation - The user operation
 * @param safeOwners - The safe owner addresses
 * @returns The user operation with the dummy signature
 */
export function addDummySignature(
  userOperation: UserOperation,
  safeOwners: string[]
): UserOperation {
  const signatures = []

  for (const owner of safeOwners) {
    const dummySignature = `0x000000000000000000000000${owner.slice(2)}000000000000000000000000000000000000000000000000000000000000000001`
    signatures.push(new EthSafeSignature(owner, dummySignature))
  }

  return {
    ...userOperation,
    signature: ethers.solidityPacked(
      ['uint48', 'uint48', 'bytes'],
      [0, 0, buildSignatureBytes(signatures)]
    )
  }
}
