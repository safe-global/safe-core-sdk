import Safe from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMultisigTransactionListResponse } from '@safe-global/api-kit'
import {
  SafeTransaction,
  TransactionBase,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'

import {
  createSafeClientResult,
  sendTransaction,
  proposeTransaction,
  waitSafeTxReceipt
} from '@safe-global/safe-kit/utils'
import { SafeClientTxStatus } from '@safe-global/safe-kit/constants'
import { SafeClientResult } from '@safe-global/safe-kit/types'

/**
 * @class
 * This class provides the core functionality to create, sign and execute transactions.
 * It also provides the ability to be extended with features through the extend function.
 *
 * @example
 * const safeClient = await createSafeClient({ ... })
 *
 * const { transactions } = await safeClient.send(...)
 * await safeClient.confirm(transactions?.safeTxHash)
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
   * @param {TransactionBase[]} transactions An array of transactions to be sent.
   * @param {TransactionOptions} [options] Optional transaction options.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the transaction.
   */
  async send(
    transactions: TransactionBase[],
    options?: TransactionOptions
  ): Promise<SafeClientResult> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    const isMultisigSafe = (await this.protocolKit.getThreshold()) > 1

    const safeTransaction = await this.protocolKit.createTransaction({ transactions })

    if (isSafeDeployed) {
      if (isMultisigSafe) {
        // If the threshold is greater than 1, we need to propose the transaction first
        return this.#proposeTransaction(safeTransaction)
      } else {
        // If the threshold is 1, we can execute the transaction
        return this.#executeTransaction(safeTransaction, options)
      }
    } else {
      if (isMultisigSafe) {
        // If the threshold is greater than 1, we need to deploy the Safe account first and
        // afterwards propose the transaction
        // The transaction should be confirmed with other owners until the threshold is reached
        return this.#deployAndProposeTransaction(safeTransaction, options)
      } else {
        // If the threshold is 1, we can deploy the Safe account and execute the transaction in one step
        return this.#deployAndExecuteTransaction(safeTransaction, options)
      }
    }
  }

  /**
   * Confirms a transaction by its safe transaction hash.
   *
   * @param {string} safeTxHash  The hash of the safe transaction to confirm.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the confirmed transaction.
   * @throws {Error} If the transaction confirmation fails.
   */
  async confirm(safeTxHash: string): Promise<SafeClientResult> {
    let transactionResponse = await this.apiKit.getTransaction(safeTxHash)
    const safeAddress = await this.protocolKit.getAddress()
    const signedTransaction = await this.protocolKit.signTransaction(transactionResponse)

    await this.apiKit.confirmTransaction(safeTxHash, signedTransaction.encodedSignatures())

    transactionResponse = await this.apiKit.getTransaction(safeTxHash)

    if (
      transactionResponse.confirmations &&
      transactionResponse.confirmationsRequired === transactionResponse.confirmations.length
    ) {
      const executedTransactionResponse: TransactionResult =
        await this.protocolKit.executeTransaction(transactionResponse)

      await waitSafeTxReceipt(executedTransactionResponse)

      return createSafeClientResult({
        status: SafeClientTxStatus.EXECUTED,
        safeAddress,
        txHash: executedTransactionResponse.hash,
        safeTxHash
      })
    }

    return createSafeClientResult({
      status: SafeClientTxStatus.PENDING_SIGNATURES,
      safeAddress,
      safeTxHash
    })
  }

  /**
   * Retrieves the pending transactions for the current safe address.
   *
   * @async
   * @returns {Promise<SafeMultisigTransactionListResponse>} A promise that resolves to an array of pending transactions.
   * @throws {Error} If there is an issue retrieving the safe address or pending transactions.
   */
  async getPendingTransactions(): Promise<SafeMultisigTransactionListResponse> {
    const safeAddress = await this.protocolKit.getAddress()

    return this.apiKit.getPendingTransactions(safeAddress)
  }

  /**
   * Extend the SafeClient with additional functionality.
   *
   * @param extendFunc
   * @returns
   */
  extend<T>(extendFunc: (client: SafeClient) => Promise<T>): Promise<SafeClient & T>
  extend<T>(extendFunc: (client: SafeClient) => T): SafeClient & T

  extend<T>(
    extendFunc: (client: SafeClient) => T | Promise<T>
  ): (SafeClient & T) | Promise<SafeClient & T> {
    const result = extendFunc(this)

    if (result instanceof Promise) {
      return result.then((extensions) => Object.assign(this, extensions) as SafeClient & T)
    } else {
      return Object.assign(this, result) as SafeClient & T
    }
  }

  /**
   * Deploys and executes a transaction in one step.
   *
   * @param {SafeTransaction} safeTransaction  The safe transaction to be executed
   * @param {TransactionOptions} options  Optional transaction options
   * @returns  A promise that resolves to the result of the transaction
   */
  async #deployAndExecuteTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<SafeClientResult> {
    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

    const transactionBatchWithDeployment =
      await this.protocolKit.wrapSafeTransactionIntoDeploymentBatch(safeTransaction, options)
    const hash = await sendTransaction(transactionBatchWithDeployment, {}, this.protocolKit)

    await this.#reconnectSafe()

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.DEPLOYED_AND_EXECUTED,
      deploymentTxHash: hash,
      txHash: hash
    })
  }

  /**
   * Deploys and proposes a transaction in one step.
   *
   * @param safeTransaction The safe transaction to be proposed
   * @param options  Optional transaction options
   * @returns  A promise that resolves to the result of the transaction
   */
  async #deployAndProposeTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<SafeClientResult> {
    const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction(
      undefined,
      options
    )
    const hash = await sendTransaction(safeDeploymentTransaction, options || {}, this.protocolKit)

    await this.#reconnectSafe()

    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
    const safeTxHash = await proposeTransaction(safeTransaction, this.protocolKit, this.apiKit)

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES,
      deploymentTxHash: hash,
      safeTxHash
    })
  }

  /**
   * Executes a transaction.
   *
   * @param {SafeTransaction} safeTransaction The safe transaction to be executed
   * @param {TransactionOptions} options Optional transaction options
   * @returns A promise that resolves to the result of the transaction
   */
  async #executeTransaction(safeTransaction: SafeTransaction, options?: TransactionOptions) {
    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

    const { hash } = await this.protocolKit.executeTransaction(safeTransaction, options)

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.EXECUTED,
      txHash: hash
    })
  }

  async #proposeTransaction(safeTransaction: SafeTransaction) {
    const safeTxHash = await proposeTransaction(safeTransaction, this.protocolKit, this.apiKit)

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.PENDING_SIGNATURES,
      safeTxHash
    })
  }

  async #reconnectSafe(): Promise<void> {
    this.protocolKit = await this.protocolKit.connect({
      provider: this.protocolKit.getSafeProvider().provider,
      signer: this.protocolKit.getSafeProvider().signer,
      safeAddress: await this.protocolKit.getAddress()
    })
  }
}
