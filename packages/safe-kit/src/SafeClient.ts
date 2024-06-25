import Safe from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMultisigTransactionListResponse } from '@safe-global/api-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { sendTransaction, sendAndDeployTransaction } from './utils'

import { SafeClientTransactionResult } from './types'

/**
 * A Safe client.
 */
export class SafeClient {
  protocolKit: Safe
  apiKit: SafeApiKit

  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    this.protocolKit = protocolKit
    this.apiKit = apiKit
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

  /**
   * Confirms a transaction by its safe transaction hash.
   *
   * @param {string} safeTxHash - The hash of the safe transaction to confirm.
   * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the confirmed transaction.
   * @throws {Error} If the transaction confirmation fails.
   */
  async confirm(safeTxHash: string): Promise<SafeClientTransactionResult> {
    let transactionResponse = await this.apiKit.getTransaction(safeTxHash)
    const signedTransaction = await this.protocolKit.signTransaction(transactionResponse)

    await this.apiKit.confirmTransaction(safeTxHash, signedTransaction.encodedSignatures())

    transactionResponse = await this.apiKit.getTransaction(safeTxHash)

    return {
      chain: {
        hash: transactionResponse.transactionHash
      },
      safeServices: {
        safeTxHash: transactionResponse.safeTxHash
      }
    }
  }

  /**
   * Retrieves the pending transactions for the current safe address.
   *
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of pending transactions.
   * @throws {Error} If there is an issue retrieving the safe address or pending transactions.
   */
  async getPendingTransactions(): Promise<SafeMultisigTransactionListResponse> {
    const safeAddress = await this.protocolKit.getAddress()

    return this.apiKit.getPendingTransactions(safeAddress)
  }

  extend<T>(extendFunc: (client: SafeClient) => T): SafeClient & T {
    return Object.assign(this, extendFunc(this))
  }
}
