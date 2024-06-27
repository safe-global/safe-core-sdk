import Safe from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMultisigTransactionListResponse } from '@safe-global/api-kit'
import {
  SafeTransaction,
  TransactionBase,
  TransactionOptions,
  TransactionResult
} from '@safe-global/safe-core-sdk-types'
import {
  createTransactionResult,
  sendTransaction,
  proposeTransaction,
  waitSafeTxReceipt
} from './utils'
import { SafeClientTxStatus } from './constants'

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
   * @param {TransactionBase[]} transactions An array of transactions to be sent.
   * @param {TransactionOptions} [options] Optional transaction options.
   * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
   * @throws {Error} If the Safe deployment with a threshold greater than one is attempted.
   */
  async send(
    transactions: TransactionBase[],
    options?: TransactionOptions
  ): Promise<SafeClientTransactionResult> {
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

      return createTransactionResult({
        status: SafeClientTxStatus.EXECUTED,
        safeAddress,
        txHash: executedTransactionResponse.hash,
        safeTxHash
      })
    }

    return createTransactionResult({
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
  extend<T>(extendFunc: (client: SafeClient) => T): SafeClient & T {
    return Object.assign(this, extendFunc(this)) as SafeClient & T
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
  ): Promise<SafeClientTransactionResult> {
    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

    const transactionBatchWithDeployment =
      await this.protocolKit.wrapSafeTransactionIntoDeploymentBatch(safeTransaction, options)
    const hash = await sendTransaction(transactionBatchWithDeployment, {}, this)

    await this.#reconnectSafe()

    return createTransactionResult({
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
  ): Promise<SafeClientTransactionResult> {
    const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction(
      undefined,
      options
    )
    const hash = await sendTransaction(safeDeploymentTransaction, options || {}, this)

    await this.#reconnectSafe()

    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
    const safeTxHash = await proposeTransaction(safeTransaction, this)

    return createTransactionResult({
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

    return createTransactionResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.EXECUTED,
      txHash: hash
    })
  }

  async #proposeTransaction(safeTransaction: SafeTransaction) {
    const safeTxHash = await proposeTransaction(safeTransaction, this)

    return createTransactionResult({
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
