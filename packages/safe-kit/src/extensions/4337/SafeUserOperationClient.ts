import Safe, { hashSafeMessage } from '@safe-global/protocol-kit'
import SafeApiKit, {
  GetSafeOperationListResponse,
  SafeMessageListResponse,
  getAddSafeOperationProps
} from '@safe-global/api-kit'
import { EIP712TypedData, SafeMessage, UserOperation } from '@safe-global/safe-core-sdk-types'
import { createSafeClientResult, sendTransaction } from '../../utils'
import { SafeClientTxStatus } from '../../constants'

import { SafeClientResult } from '../../types'
import { Safe4337CreateTransactionProps, Safe4337Pack } from 'packages/relay-kit/dist/src'

/**
 * @class
 * This class provides the functionality to create, sign and execute transactions.
 */
export class SafeUserOperationClient {
  protocolKit: Safe
  apiKit: SafeApiKit
  safe4337Pack: Safe4337Pack

  constructor(safe4337Pack: Safe4337Pack, apiKit: SafeApiKit) {
    this.protocolKit = safe4337Pack.protocolKit
    this.apiKit = apiKit
    this.safe4337Pack = safe4337Pack
  }

  /**
   * Send transactions through the Safe protocol.
   *
   * @param {string | EIP712TypedData} message The message.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the transaction.
   * @throws {Error} If the Safe deployment with a threshold greater than one is attempted.
   */
  async sendUserOperation({
    transactions,
    options = {}
  }: Safe4337CreateTransactionProps): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    let safeOperation = await this.safe4337Pack.createTransaction({ transactions, options })
    safeOperation = await this.safe4337Pack.signSafeOperation(safeOperation)

    const isMultisigSafe = (await this.protocolKit.getThreshold()) > 1
    if (isMultisigSafe) {
      const userOperation = safeOperation.toUserOperation()
      userOperation.signature = safeOperation.encodedSignatures() // Without validity dates

      await this.apiKit.addSafeOperation({
        entryPoint: safeOperation.data.entryPoint,
        moduleAddress: safeOperation.moduleAddress,
        safeAddress: safeOperation.data.safe,
        userOperation,
        options: {
          validAfter: safeOperation.data.validAfter,
          validUntil: safeOperation.data.validUntil
        }
      })

      const safeOperationHash = safeOperation.getHash()

      return createSafeClientResult({
        safeAddress,
        status: SafeClientTxStatus.USER_OPERATION_PENDING_SIGNATURES,
        safeOperationHash
      })
    }

    const userOperationHash = await this.safe4337Pack.executeTransaction({
      executable: safeOperation
    })

    return createSafeClientResult({
      safeAddress,
      status: SafeClientTxStatus.USER_OPERATION_EXECUTED,
      userOperationHash
    })
  }

  /**
   * Confirms a transaction by its safe transaction hash.
   *
   * @param {string} userOperationHash  The hash of the safe operation to confirm.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the confirmed transaction.
   * @throws {Error} If the transaction confirmation fails.
   */
  async confirmUserOperation(safeOpHash: string): Promise<SafeClientResult> {}

  /**
   * Retrieves the pending Safe operations for the current safe address.
   *
   * @async
   * @returns {Promise<GetSafeOperationListResponse>} A promise that resolves to an array of pending Safe operations.
   * @throws {Error} If there is an issue retrieving the safe address or pending Safe operations.
   */
  async getPendingUserOperations(): Promise<GetSafeOperationListResponse> {
    const safeAddress = await this.protocolKit.getAddress()
    return this.apiKit.getSafeOperationsByAddress({ safeAddress })
  }
}
