import Safe, { buildSignatureBytes } from '@safe-global/protocol-kit'
import SafeApiKit, { GetSafeOperationListResponse } from '@safe-global/api-kit'
import { Safe4337CreateTransactionProps, Safe4337Pack } from '@safe-global/relay-kit'

import { createSafeClientResult } from '@safe-global/safe-kit/utils'
import { SafeClientTxStatus } from '@safe-global/safe-kit/constants'
import { SafeClientResult } from '@safe-global/safe-kit/types'

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
   * @param {TransactionOptions} [props.options] Optional transaction options
   * @returns {Promise<SafeClientResult>} A promise that resolves with the status of the SafeOperation
   */
  async sendSafeOperation({
    transactions,
    options = {}
  }: Safe4337CreateTransactionProps): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const isMultisigSafe = (await this.protocolKit.getThreshold()) > 1

    let safeOperation = await this.safe4337Pack.createTransaction({ transactions, options })
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

    await this.#waitForOperationToFinish(userOperationHash)

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
   * @param {string} safeOperationHash The hash of the safe operation to confirm.
   * The safeOperationHash can be extracted from the SafeClientResult of the sendSafeOperation method under the safeOperations property
   * You must confirmSafeOperation() with the other owners and once the threshold is reached the SafeOperation will be sent to the bundler
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the safeOperation.
   */
  async confirmSafeOperation(safeOperationHash: string): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const threshold = await this.protocolKit.getThreshold()

    // TODO: Using signSafeOperation with the API response is not working
    // This should be investigated as the safeOperationHash we get in the Safe4337Pack
    // seems to be different from the one we get from the API
    await this.apiKit.confirmSafeOperation(
      safeOperationHash,
      buildSignatureBytes([await this.protocolKit.signHash(safeOperationHash)])
    )

    const confirmedSafeOperation = await this.apiKit.getSafeOperation(safeOperationHash)

    if (confirmedSafeOperation?.confirmations?.length === threshold) {
      const userOperationHash = await this.safe4337Pack.executeTransaction({
        executable: confirmedSafeOperation
      })

      await this.#waitForOperationToFinish(userOperationHash)

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
   * @returns {Promise<GetSafeOperationListResponse>} A promise that resolves to an array of pending Safe operations.
   * @throws {Error} If there is an issue retrieving the safe address or pending Safe operations.
   */
  async getPendingSafeOperations(): Promise<GetSafeOperationListResponse> {
    const safeAddress = await this.protocolKit.getAddress()
    return this.apiKit.getSafeOperationsByAddress({ safeAddress })
  }

  /**
   * Helper method to wait for the operation to finish
   * @param userOperationHash The userOperationHash to wait for. This comes from the bundler and can be obtained from the
   * SafeClientResult method under the safeOperations property
   */
  async #waitForOperationToFinish(userOperationHash: string): Promise<void> {
    let userOperationReceipt = null
    while (!userOperationReceipt) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      userOperationReceipt = await this.safe4337Pack.getUserOperationReceipt(userOperationHash)
    }
  }
}
