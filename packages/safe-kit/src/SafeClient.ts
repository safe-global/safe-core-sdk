import Safe from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMultisigTransactionListResponse } from '@safe-global/api-kit'
import {
  TransactionBase,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import {
  SafeClientTxStatus,
  createTransactionResult,
  executeWithSigner,
  proposeTransaction,
  waitSafeTxReceipt
} from './utils'

import { SafeClientTransactionResult } from './types'

/**
 * @class
 * This class provides the functionality to create, sign and execute transactions.
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
    const safeAddress = await this.protocolKit.getAddress()
    let safeTransaction = await this.protocolKit.createTransaction({ transactions })

    const threshold = await this.protocolKit.getThreshold()

    if (!isSafeDeployed) {
      // If the Safe does not exist we need to deploy it first
      if (threshold === 1) {
        // If the threshold is 1, we can deploy the Safe account and execute the transaction in one step
        safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
        const transactionBatchWithDeployment =
          await this.protocolKit.wrapSafeTransactionIntoDeploymentBatch(safeTransaction, options)
        const hash = await executeWithSigner(transactionBatchWithDeployment, {}, this)
        return createTransactionResult({
          status: SafeClientTxStatus.DEPLOYED_AND_EXECUTED,
          safeAddress,
          deploymentTxHash: hash,
          txHash: hash
        })
      } else {
        // If the threshold is greater than 1, we need to deploy the Safe account first and
        // after propose the transaction. The transaction should be confirmed with another owners
        // until the threshold is reached
        const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction(
          undefined,
          options
        )
        const hash = await executeWithSigner(safeDeploymentTransaction, options || {}, this)
        this.protocolKit = await this.protocolKit.connect({
          provider: this.protocolKit.getSafeProvider().provider,
          signer: this.protocolKit.getSafeProvider().signer,
          safeAddress: await this.protocolKit.getAddress()
        })

        safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
        const safeTxHash = await proposeTransaction(safeTransaction, this)

        return createTransactionResult({
          status: SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES,
          safeAddress,
          deploymentTxHash: hash,
          safeTxHash
        })
      }
    } else {
      // If the Safe is deployed we can either execute or propose the transaction
      safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

      if (threshold === 1) {
        // If the threshold is 1, we can execute the transaction
        const { hash } = await this.protocolKit.executeTransaction(safeTransaction, options)

        return createTransactionResult({
          status: SafeClientTxStatus.EXECUTED,
          txHash: hash
        })
      } else {
        // If the threshold is greater than 1, we need to propose the transaction first
        const safeTxHash = await proposeTransaction(safeTransaction, this)

        return createTransactionResult({
          status: SafeClientTxStatus.PENDING_SIGNATURES,
          safeTxHash
        })
      }
    }
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
    const safeAddress = await this.protocolKit.getAddress()
    const signedTransaction = await this.protocolKit.signTransaction(transactionResponse)

    await this.apiKit.confirmTransaction(safeTxHash, signedTransaction.encodedSignatures())

    transactionResponse = await this.apiKit.getTransaction(safeTxHash)
    let executedTransactionResponse: TransactionResult = {
      hash: '',
      transactionResponse: undefined
    }

    if (
      transactionResponse.confirmations &&
      transactionResponse.confirmationsRequired === transactionResponse.confirmations.length
    ) {
      executedTransactionResponse = await this.protocolKit.executeTransaction(transactionResponse)
      await waitSafeTxReceipt(executedTransactionResponse)
    }

    return createTransactionResult({
      status: SafeClientTxStatus.EXECUTED,
      safeAddress,
      txHash: executedTransactionResponse.hash,
      safeTxHash
    })
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
