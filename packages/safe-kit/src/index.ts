import Safe from '@safe-global/protocol-kit'
import {
  TransactionBase,
  TransactionOptions,
  SafeTransaction,
  OperationType
} from '@safe-global/safe-core-sdk-types'
import { SafeClient, SafeKitConfig } from './types'
import { AbstractSigner } from 'ethers'

/**
 * Initializes a Safe client with the given configuration options.
 * @param options - The SafeKit configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(config: SafeKitConfig): Promise<SafeClient> {
  const protocolKit = await getSafeProtocolKit(config)
  if (!protocolKit) throw new Error('Failed to create Safe client')

  return {
    protocolKit,
    send: async (transactions: TransactionBase[], options?: TransactionOptions) => {
      const isSafeDeployed = await protocolKit.isSafeDeployed()
      console.log('Safe: ', await protocolKit.getAddress(), isSafeDeployed)
      let safeTransaction: SafeTransaction
      let txHash: string | undefined

      if (!isSafeDeployed) {
        const safeDeploymentTransaction = await protocolKit.createSafeDeploymentTransaction(
          config?.safeOptions?.saltNonce
        )

        transactions.unshift(safeDeploymentTransaction)

        const safeDeploymentBatch = await protocolKit.createTransactionBatch(
          transactions.map((tx) => ({ ...tx, operation: OperationType.Call })),
          options
        )

        const signer = (await protocolKit
          .getSafeProvider()
          .getExternalSigner()) as unknown as AbstractSigner

        const txResult = await signer.sendTransaction({
          from: (await protocolKit.getSafeProvider().getSignerAddress()) || '0x',
          ...safeDeploymentBatch
        })

        const txResponse = await txResult.wait()

        txHash = txResponse?.hash
      } else {
        safeTransaction = await protocolKit.createTransaction({
          transactions
        })
        safeTransaction = await protocolKit.signTransaction(safeTransaction)
        console.log(safeTransaction)
        const { hash } = await protocolKit.executeTransaction(safeTransaction, options)

        txHash = hash
      }

      return { hash: txHash }
    }
  }
}

/**
 * Retrieves the Safe protocol kit.
 * @param config - The configuration options.
 * @returns A protocolKit instance.
 */
async function getSafeProtocolKit(config: SafeKitConfig): Promise<Safe> {
  if (config.safeAddress) {
    return Safe.init({
      provider: config.provider,
      signer: config.signer,
      safeAddress: config.safeAddress
    })
  } else if (config.safeOptions) {
    const protocolKit = await Safe.init({
      provider: config.provider,
      signer: config.signer,
      predictedSafe: {
        safeAccountConfig: {
          owners: config.safeOptions.owners,
          threshold: config.safeOptions.threshold
        },
        safeDeploymentConfig: {
          saltNonce: config.safeOptions.saltNonce
        }
      }
    })

    const isSafeDeployed = await protocolKit.isSafeDeployed()

    if (isSafeDeployed) {
      return Safe.init({
        provider: config.provider,
        signer: config.signer,
        safeAddress: await protocolKit.getAddress()
      })
    }

    return protocolKit
  } else {
    throw new Error('Invalid configuration: either safeAddress or safeConfig must be provided.')
  }
}
