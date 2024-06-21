import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'

import { SafeClientTransactionResult } from './types'
import { sendTransaction, sendAndDeployTransaction } from './utils'

/**
 * A Safe client.
 */
export class SafeClient {
  protocolKit: Safe

  constructor(protocolKit: Safe) {
    this.protocolKit = protocolKit
  }

  /**
   * Sends transactions through the Safe protocol.
   *
   * @param {TransactionBase[]} transactions - An array of transactions to be sent.
   * @param {TransactionOptions} [options] - Optional transaction options.
   * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
   * @throws {Error} If the Safe deployment with a threshold greater than one is attempted.
   */
  async send(
    transactions: TransactionBase[],
    options?: TransactionOptions
  ): Promise<SafeClientTransactionResult> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()

    let txResult: SafeClientTransactionResult

    if (!isSafeDeployed) {
      const threshold = await this.protocolKit.getThreshold()

      if (threshold === 1) {
        txResult = await sendAndDeployTransaction(transactions, options || {}, this)
      } else {
        // TODO: Threshold more than 1 with deployment
        // 1. Deploy Safe (No signatures needed)
        // 2. Use api-kit to proposeTransaction with the current signer
        throw new Error(
          'Deployment of Safes with threshold more than one is currently not supported '
        )
      }
    } else {
      txResult = await sendTransaction(transactions, options || {}, this)
    }

    return txResult
  }

  extend<T>(extendFunc: (client: SafeClient) => T): SafeClient & T {
    return Object.assign(this, extendFunc(this))
  }
}
