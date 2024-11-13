import Safe from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMultisigTransactionListResponse } from '@safe-global/api-kit'
import { SafeTransaction, TransactionOptions, TransactionResult } from '@safe-global/types-kit'

import {
  createSafeClientResult,
  sendTransaction,
  proposeTransaction,
  waitSafeTxReceipt
} from '@safe-global/sdk-starter-kit/utils'
import { SafeClientTxStatus } from '@safe-global/sdk-starter-kit/constants'
import {
  ConfirmTransactionProps,
  SafeClientResult,
  SendTransactionProps
} from '@safe-global/sdk-starter-kit/types'

import { BaseClient } from './BaseClient'

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
export class SafeClient extends BaseClient {
  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    super(protocolKit, apiKit)
  }

  /**
   * Sends transactions through the Safe protocol.
   * You can send an array to transactions { to, value, data} that we will convert to a transaction batch
   *
   * @param {SendTransactionProps} props The SendTransactionProps object.
   * @param {TransactionBase[]} props.transactions An array of transactions to be sent.
   * @param {string} props.transactions[].to The recipient address of the transaction.
   * @param {string} props.transactions[].value The value of the transaction.
   * @param {string} props.transactions[].data The data of the transaction.
   * @param {string} props.from The sender address of the transaction.
   * @param {number | string} props.gasLimit The gas limit of the transaction.
   * @param {number | string} props.gasPrice The gas price of the transaction.
   * @param {number | string} props.maxFeePerGas The max fee per gas of the transaction.
   * @param {number | string} props.maxPriorityFeePerGas The max priority fee per gas of the transaction.
   * @param {number} props.nonce The nonce of the transaction.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the transaction.
   */
  async send({
    transactions,
    ...transactionOptions
  }: SendTransactionProps): Promise<SafeClientResult> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    const isMultisigSafe = (await this.protocolKit.getThreshold()) > 1

    const safeTransaction = await this.protocolKit.createTransaction({ transactions })

    if (isSafeDeployed) {
      if (isMultisigSafe) {
        // If the threshold is greater than 1, we need to propose the transaction first
        return this.#proposeTransaction({ safeTransaction })
      } else {
        // If the threshold is 1, we can execute the transaction
        return this.#executeTransaction({ safeTransaction, ...transactionOptions })
      }
    } else {
      if (isMultisigSafe) {
        // If the threshold is greater than 1, we need to deploy the Safe account first and
        // afterwards propose the transaction
        // The transaction should be confirmed with other owners until the threshold is reached
        return this.#deployAndProposeTransaction({ safeTransaction, ...transactionOptions })
      } else {
        // If the threshold is 1, we can deploy the Safe account and execute the transaction in one step
        return this.#deployAndExecuteTransaction({ safeTransaction, ...transactionOptions })
      }
    }
  }

  /**
   * Confirms a transaction by its safe transaction hash.
   *
   * @param {ConfirmTransactionProps} props The ConfirmTransactionProps object.
   * @param {string} props.safeTxHash  The hash of the safe transaction to confirm.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the confirmed transaction.
   * @throws {Error} If the transaction confirmation fails.
   */
  async confirm({ safeTxHash }: ConfirmTransactionProps): Promise<SafeClientResult> {
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
  extend<T>(extendFunc: (client: this) => Promise<T>): Promise<this & T>
  extend<T>(extendFunc: (client: this) => T): this & T

  extend<T>(extendFunc: (client: this) => T | Promise<T>): (this & T) | Promise<this & T> {
    const result = extendFunc(this)

    if (result instanceof Promise) {
      return result.then((extensions) => Object.assign(this, extensions) as this & T)
    } else {
      return Object.assign(this, result) as this & T
    }
  }

  /**
   * Deploys and executes a transaction in one step.
   *
   * @param {SafeTransaction} safeTransaction  The safe transaction to be executed
   * @param {TransactionOptions} options  Optional transaction options
   * @returns  A promise that resolves to the result of the transaction
   */
  async #deployAndExecuteTransaction({
    safeTransaction,
    ...transactionOptions
  }: { safeTransaction: SafeTransaction } & TransactionOptions): Promise<SafeClientResult> {
    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

    const transactionBatchWithDeployment =
      await this.protocolKit.wrapSafeTransactionIntoDeploymentBatch(
        safeTransaction,
        transactionOptions
      )
    const hash = await sendTransaction({
      transaction: transactionBatchWithDeployment,
      protocolKit: this.protocolKit
    })

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
   * @param {SafeTransaction} safeTransaction The safe transaction to be proposed
   * @param {TransactionOptions} transactionOptions  Optional transaction options
   * @returns  A promise that resolves to the result of the transaction
   */
  async #deployAndProposeTransaction({
    safeTransaction,
    ...transactionOptions
  }: {
    safeTransaction: SafeTransaction
  } & TransactionOptions): Promise<SafeClientResult> {
    const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction()
    const hash = await sendTransaction({
      transaction: { ...safeDeploymentTransaction, ...transactionOptions },
      protocolKit: this.protocolKit
    })

    await this.#reconnectSafe()

    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)
    const safeTxHash = await proposeTransaction({
      safeTransaction,
      protocolKit: this.protocolKit,
      apiKit: this.apiKit
    })

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
   * @param {TransactionOptions} transactionOptions Optional transaction options
   * @returns A promise that resolves to the result of the transaction
   */
  async #executeTransaction({
    safeTransaction,
    ...transactionOptions
  }: { safeTransaction: SafeTransaction } & TransactionOptions): Promise<SafeClientResult> {
    safeTransaction = await this.protocolKit.signTransaction(safeTransaction)

    const { hash } = await this.protocolKit.executeTransaction(safeTransaction, transactionOptions)

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status: SafeClientTxStatus.EXECUTED,
      txHash: hash
    })
  }

  /**
   *  Proposes a transaction to the Safe.
   * @param { SafeTransaction } safeTransaction The safe transaction to propose
   * @returns The SafeClientResult
   */
  async #proposeTransaction({ safeTransaction }: { safeTransaction: SafeTransaction }) {
    const safeTxHash = await proposeTransaction({
      safeTransaction,
      protocolKit: this.protocolKit,
      apiKit: this.apiKit
    })

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
