import Safe, { buildSignatureBytes } from '@safe-global/protocol-kit'
import SafeApiKit, { ListOptions, GetSafeOperationListResponse } from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'

import { createSafeClientResult } from '@safe-global/sdk-starter-kit/utils'
import { SafeClientTxStatus } from '@safe-global/sdk-starter-kit/constants'
import {
  ConfirmSafeOperationProps,
  SafeClientResult,
  SendSafeOperationProps
} from '@safe-global/sdk-starter-kit/types'
import { SafeOperationResponse } from '@safe-global/types-kit'

/**
 * @class
 * This class provides the functionality to use a bundler and a paymaster with your Safe account
 * With the features implemented here we can add EIP-4377 support to the Safe account
 */
export class SafeOperationClient {
  protocolKit: Safe
  apiKit: SafeApiKit
  safe4337Pack: Safe4337Pack

  constructor(safe4337Pack: Safe4337Pack, apiKit: SafeApiKit) {
    this.protocolKit = safe4337Pack.protocolKit
    this.apiKit = apiKit
    this.safe4337Pack = safe4337Pack
  }

  /**
   * Send SafeOperations from a group of transactions.
   * This method will convert your transactions in a batch and:
   * - If the threshold > 1 it will save for later the SafeOperation using the Transaction service
   *   You must confirmSafeOperation() with other owners
   * - If the threshold = 1 the SafeOperation can be submitted to the bundler so it will execute it immediately
   *
   * @param {Safe4337CreateTransactionProps} props The Safe4337CreateTransactionProps object
   * @param {SafeTransaction[]} props.transactions An array of transactions to be batched
   * @param {TransactionOptions} [props.amountToApprove] The amount to approve for the SafeOperation
   * @param {TransactionOptions} [props.validUntil] The validUntil timestamp for the SafeOperation
   * @param {TransactionOptions} [props.validAfter] The validAfter timestamp for the SafeOperation
   * @param {TransactionOptions} [props.feeEstimator] The feeEstimator to calculate the fees
   * @returns {Promise<SafeClientResult>} A promise that resolves with the status of the SafeOperation
   */
  async sendSafeOperation({
    transactions,
    ...sendSafeOperationOptions
  }: SendSafeOperationProps): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const isMultisigSafe = (await this.protocolKit.getThreshold()) > 1

    let safeOperation = await this.safe4337Pack.createTransaction({
      transactions,
      options: sendSafeOperationOptions
    })
    safeOperation = await this.safe4337Pack.signSafeOperation(safeOperation)

    if (isMultisigSafe) {
      await this.apiKit.addSafeOperation(safeOperation)

      const safeOperationHash = safeOperation.getHash()

      return createSafeClientResult({
        safeAddress,
        status: SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES,
        safeOperationHash
      })
    }

    const userOperationHash = await this.safe4337Pack.executeTransaction({
      executable: safeOperation
    })

    await this.#waitForOperationToFinish({ userOperationHash })

    return createSafeClientResult({
      safeAddress,
      status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
      userOperationHash,
      safeOperationHash: safeOperation.getHash()
    })
  }

  /**
   * Confirms the stored safeOperation
   *
   * @param {ConfirmSafeOperationProps} props The confirmation properties
   * @param {string} props.safeOperationHash The hash of the safe operation to confirm.
   * The safeOperationHash can be extracted from the SafeClientResult of the sendSafeOperation method under the safeOperations property
   * You must confirmSafeOperation() with the other owners and once the threshold is reached the SafeOperation will be sent to the bundler
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the safeOperation.
   */
  async confirmSafeOperation({
    safeOperationHash
  }: ConfirmSafeOperationProps): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const threshold = await this.protocolKit.getThreshold()
    let safeOperationResponse = await this.apiKit.getSafeOperation(safeOperationHash)

    if (safeOperationResponse.userOperation?.ethereumTxHash) {
      return createSafeClientResult({
        status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
        safeAddress,
        userOperationHash: safeOperationResponse.userOperation.userOperationHash,
        safeOperationHash
      })
    }

    if (this.#needsConfirmation(safeOperationResponse, threshold)) {
      const signature = buildSignatureBytes([await this.protocolKit.signHash(safeOperationHash)])

      await this.apiKit.confirmSafeOperation(safeOperationHash, signature)

      safeOperationResponse = await this.apiKit.getSafeOperation(safeOperationHash)
    }

    if (!this.#needsConfirmation(safeOperationResponse, threshold)) {
      const userOperationHash = await this.safe4337Pack.executeTransaction({
        executable: safeOperationResponse
      })

      await this.#waitForOperationToFinish({ userOperationHash })

      return createSafeClientResult({
        status: SafeClientTxStatus.SAFE_OPERATION_EXECUTED,
        safeAddress,
        userOperationHash,
        safeOperationHash
      })
    }

    return createSafeClientResult({
      status: SafeClientTxStatus.SAFE_OPERATION_PENDING_SIGNATURES,
      safeAddress,
      safeOperationHash
    })
  }

  /**
   * Retrieves the pending Safe operations for the current Safe account
   *
   * @async
   * @param {ListOptions} options The pagination options
   * @returns {Promise<GetSafeOperationListResponse>} A promise that resolves to an array of pending Safe operations.
   * @throws {Error} If there is an issue retrieving the safe address or pending Safe operations.
   */
  async getPendingSafeOperations(options?: ListOptions): Promise<GetSafeOperationListResponse> {
    const safeAddress = await this.protocolKit.getAddress()

    return this.apiKit.getPendingSafeOperations(safeAddress, options)
  }

  #needsConfirmation(safeOperationResponse: SafeOperationResponse, threshold: number): boolean {
    return (safeOperationResponse.confirmations?.length || 0) < threshold
  }

  /**
   * Helper method to wait for the operation to finish
   * @param userOperationHash The userOperationHash to wait for. This comes from the bundler and can be obtained from the
   * SafeClientResult method under the safeOperations property
   */
  async #waitForOperationToFinish({
    userOperationHash
  }: {
    userOperationHash: string
  }): Promise<void> {
    let userOperationReceipt = null
    while (!userOperationReceipt) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      userOperationReceipt = await this.safe4337Pack.getUserOperationReceipt(userOperationHash)
    }
  }
}
