import {
  Hash,
  PublicRpcSchema,
  createPublicClient,
  encodeFunctionData,
  encodePacked,
  hashTypedData,
  http,
  rpcSchema,
  toHex
} from 'viem'
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
import { ABI, EIP712_SAFE_OPERATION_TYPE } from './constants'
import { BundlerClient, PimlicoCustomRpcSchema } from './types'

/**
 * Gets the EIP-4337 bundler provider.
 *
 * @param {string} bundlerUrl The EIP-4337 bundler URL.
 * @return {BundlerClient} The EIP-4337 bundler provider.
 */
export function getEip4337BundlerProvider(bundlerUrl: string): BundlerClient {
  const provider = createPublicClient({
    transport: http(bundlerUrl),
    rpcSchema: rpcSchema<[...PimlicoCustomRpcSchema, ...PublicRpcSchema]>()
  })

  return provider
}

/**
 * Signs typed data.
 *
 * @param {SafeUserOperation} safeUserOperation - Safe user operation to sign.
 * @param {SafeProvider} safeProvider - Safe provider.
 * @param {Hash} safe4337ModuleAddress - Safe 4337 module address.
 * @return {Promise<SafeSignature>} The SafeSignature object containing the data and the signatures.
 */
export async function signSafeOp(
  safeUserOperation: SafeUserOperation,
  safeProvider: SafeProvider,
  safe4337ModuleAddress: Hash
): Promise<SafeSignature> {
  const signer = await safeProvider.getExternalSigner()

  if (!signer) {
    throw new Error('No signer found')
  }

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
      nonce: toHex(safeUserOperation.nonce),
      validAfter: toHex(safeUserOperation.validAfter),
      validUntil: toHex(safeUserOperation.validUntil),
      maxFeePerGas: toHex(safeUserOperation.maxFeePerGas),
      maxPriorityFeePerGas: toHex(safeUserOperation.maxPriorityFeePerGas)
    }
  )

  return new EthSafeSignature(signerAddress, signature)
}

/**
 * Encodes multi-send data from transactions batch.
 *
 * @param {MetaTransactionData[]} transactions - an array of transaction to to be encoded.
 * @return {Hash} The encoded data string.
 */
export function encodeMultiSendCallData(transactions: MetaTransactionData[]): Hash {
  return encodeFunctionData({
    abi: ABI,
    functionName: 'multiSend',
    args: [
      encodeMultiSendData(
        transactions.map((tx) => ({ ...tx, operation: tx.operation ?? OperationType.Call }))
      )
    ]
  })
}

/**
 * Gets the safe user operation hash.
 *
 * @param {SafeUserOperation} safeUserOperation - The SafeUserOperation.
 * @param {bigint} chainId - The chain id.
 * @param {Hash} safe4337ModuleAddress - The Safe 4337 module address.
 * @return {string} The hash of the safe operation.
 */
export function calculateSafeUserOperationHash(
  safeUserOperation: SafeUserOperation,
  chainId: bigint,
  safe4337ModuleAddress: Hash
): Hash {
  return hashTypedData({
    domain: {
      chainId: Number(chainId),
      verifyingContract: safe4337ModuleAddress
    },
    types: EIP712_SAFE_OPERATION_TYPE,
    primaryType: 'SafeOp',
    message: safeUserOperation
  })
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
    nonce: toHex(BigInt(userOperation.nonce)),
    callGasLimit: toHex(userOperation.callGasLimit),
    verificationGasLimit: toHex(userOperation.verificationGasLimit),
    preVerificationGas: toHex(userOperation.preVerificationGas),
    maxFeePerGas: toHex(userOperation.maxFeePerGas),
    maxPriorityFeePerGas: toHex(userOperation.maxPriorityFeePerGas)
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
    signature: encodePacked(
      ['uint48', 'uint48', 'bytes'],
      [0, 0, buildSignatureBytes(signatures) as Hash]
    )
  }
}
