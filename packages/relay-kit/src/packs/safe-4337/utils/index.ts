import { Hex, PublicRpcSchema, createPublicClient, encodeFunctionData, http, rpcSchema } from 'viem'
import { OperationType, MetaTransactionData } from '@safe-global/types-kit'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { ABI } from '@safe-global/relay-kit/packs/safe-4337/constants'
import {
  BundlerClient,
  RpcSchemaEntry,
  Safe4337RpcSchema
} from '@safe-global/relay-kit/packs/safe-4337/types'

/**
 * Gets the EIP-4337 bundler provider.
 *
 * @param {string} bundlerUrl The EIP-4337 bundler URL.
 * @return {BundlerClient} The EIP-4337 bundler provider.
 */
export function createBundlerClient<ProviderCustomRpcSchema extends RpcSchemaEntry[] = []>(
  bundlerUrl: string
): BundlerClient<ProviderCustomRpcSchema> {
  const provider = createPublicClient({
    transport: http(bundlerUrl),
    rpcSchema: rpcSchema<[...PublicRpcSchema, ...Safe4337RpcSchema, ...ProviderCustomRpcSchema]>()
  })

  return provider
}

/**
 * Encodes multi-send data from transactions batch.
 *
 * @param {MetaTransactionData[]} transactions - an array of transaction to to be encoded.
 * @return {string} The encoded data string.
 */
export function encodeMultiSendCallData(transactions: MetaTransactionData[]): string {
  return encodeFunctionData({
    abi: ABI,
    functionName: 'multiSend',
    args: [
      encodeMultiSendData(
        transactions.map((tx) => ({ ...tx, operation: tx.operation ?? OperationType.Call }))
      ) as Hex
    ]
  })
}

export * from './entrypoint'
export * from './signing'
export * from './userOperations'
export * from './getRelayKitVersion'
