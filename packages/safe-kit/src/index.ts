import Safe from '@safe-global/protocol-kit'
import { AbstractSigner } from 'ethers'
import {
  TransactionBase,
  TransactionOptions,
  SafeTransaction,
  OperationType
} from '@safe-global/safe-core-sdk-types'
import { SafeClient, SafeKitConfig } from './types'

class SafeClientImpl implements SafeClient {
  protocolKit: Safe

  constructor(protocolKit: Safe) {
    this.protocolKit = protocolKit
  }

  async send(
    transactions: TransactionBase[],
    options?: TransactionOptions
  ): Promise<{ hash: string | undefined }> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    console.log('Safe: ', await this.protocolKit.getAddress(), isSafeDeployed)
    let safeTransaction: SafeTransaction
    let txHash: string | undefined

    if (!isSafeDeployed) {
      const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction(
        (this.protocolKit as any).safeConfig?.saltNonce
      )

      transactions.unshift(safeDeploymentTransaction)

      const safeDeploymentBatch = await this.protocolKit.createTransactionBatch(
        transactions.map((tx) => ({ ...tx, operation: OperationType.Call })),
        options
      )

      const signer = (await this.protocolKit
        .getSafeProvider()
        .getExternalSigner()) as unknown as AbstractSigner

      const txResult = await signer.sendTransaction({
        from: (await this.protocolKit.getSafeProvider().getSignerAddress()) || '0x',
        ...safeDeploymentBatch
      })

      const txResponse = await txResult.wait()

      txHash = txResponse?.hash
    } else {
      safeTransaction = await this.protocolKit.createTransaction({ transactions })
      safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
      console.log(safeTransaction)
      const { hash } = await this.protocolKit.executeTransaction(safeTransaction, options)

      txHash = hash
    }

    return { hash: txHash }
  }

  extend<T>(extendFunc: (client: SafeClient) => T): SafeClient & T {
    return Object.assign(this, extendFunc(this))
  }
}

/**
 * Initializes a Safe client with the given configuration options.
 * @param config - The SafeKit configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(config: SafeKitConfig): Promise<SafeClient> {
  const protocolKit = await getSafeProtocolKit(config)
  if (!protocolKit) throw new Error('Failed to create Safe client')

  return new SafeClientImpl(protocolKit)
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
    throw new Error('Invalid configuration: either safeAddress or safeOptions must be provided.')
  }
}
