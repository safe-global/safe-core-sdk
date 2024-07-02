import Safe, { hashSafeMessage } from '@safe-global/protocol-kit'
import SafeApiKit, { SafeMessageListResponse } from '@safe-global/api-kit'
import { EIP712TypedData, SafeMessage } from '@safe-global/safe-core-sdk-types'
import { createSafeClientResult, sendTransaction } from '../../utils'
import { SafeClientTxStatus } from '../../constants'

import { SafeClientResult } from '../../types'

/**
 * @class
 * This class provides the functionality to create, sign and execute transactions.
 */
export class SafeMessageClient {
  protocolKit: Safe
  apiKit: SafeApiKit

  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    this.protocolKit = protocolKit
    this.apiKit = apiKit
  }

  /**
   * Send transactions through the Safe protocol.
   *
   * @param {string | EIP712TypedData} message The message.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the transaction.
   * @throws {Error} If the Safe deployment with a threshold greater than one is attempted.
   */
  async sendMessage(message: string | EIP712TypedData): Promise<SafeClientResult> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    const safeMessage = this.protocolKit.createMessage(message)

    if (isSafeDeployed) {
      // If the threshold is greater than 1, we need to confirm the message after storing it
      // If the threshold is 1, then the message is confirmed and valid immediately
      return this.#addMessage(safeMessage)
    } else {
      // If the threshold is greater than 1, we need to deploy the Safe account first and
      // afterwards add the message
      // The message should be confirmed with other owners until the threshold is reached
      // If the threshold is 1, we can deploy the Safe account and add the message which will be valid immediately
      return this.#deployAndAddMessage(safeMessage)
    }
  }

  /**
   * Confirms a transaction by its safe transaction hash.
   *
   * @param {string} safeTxHash  The hash of the safe transaction to confirm.
   * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the confirmed transaction.
   * @throws {Error} If the transaction confirmation fails.
   */
  async confirmMessage(messageHash: string): Promise<SafeClientResult> {
    let messageResponse = await this.apiKit.getMessage(messageHash)
    const safeAddress = await this.protocolKit.getAddress()
    const threshold = await this.protocolKit.getThreshold()
    let safeMessage = this.protocolKit.createMessage(messageResponse.message as any)
    safeMessage = await this.protocolKit.signMessage(safeMessage)

    await this.apiKit.addMessageSignature(messageHash, safeMessage.encodedSignatures())

    messageResponse = await this.apiKit.getMessage(messageHash)

    return createSafeClientResult({
      status:
        messageResponse.confirmations.length === threshold
          ? SafeClientTxStatus.MESSAGE_CONFIRMED
          : SafeClientTxStatus.MESSAGE_PENDING_SIGNATURES,
      safeAddress,
      messageHash
    })
  }

  /**
   * Retrieves the pending transactions for the current safe address.
   *
   * @async
   * @returns {Promise<SafeMultisigTransactionListResponse>} A promise that resolves to an array of pending transactions.
   * @throws {Error} If there is an issue retrieving the safe address or pending transactions.
   */
  async getPendingMessages(): Promise<SafeMessageListResponse> {
    const safeAddress = await this.protocolKit.getAddress()

    return this.apiKit.getMessages(safeAddress)
  }

  /**
   * Deploys and executes a transaction in one step.
   *
   * @param {SafeTransaction} safeTransaction  The safe transaction to be executed
   * @param {TransactionOptions} options  Optional transaction options
   * @returns  A promise that resolves to the result of the transaction
   */
  async #deployAndAddMessage(safeMessage: SafeMessage): Promise<SafeClientResult> {
    const threshold = await this.protocolKit.getThreshold()
    const safeDeploymentTransaction =
      await this.protocolKit.createSafeDeploymentTransaction(undefined)
    try {
      const hash = await sendTransaction(safeDeploymentTransaction, {}, this.protocolKit)
      await this.#reconnectSafe()

      const messageResult = await this.#addMessage(safeMessage)
      const message = await this.apiKit.getMessage(messageResult.messages?.messageHash || '0x')

      return createSafeClientResult({
        safeAddress: await this.protocolKit.getAddress(),
        status:
          message.confirmations.length === threshold
            ? SafeClientTxStatus.DEPLOYED_AND_MESSAGE_CONFIRMED
            : SafeClientTxStatus.DEPLOYED_AND_MESSAGE_PENDING_SIGNATURES,
        deploymentTxHash: hash,
        messageHash: messageResult.messages?.messageHash
      })
    } catch (error) {
      console.error('Error deploying and adding message: ', error)
      throw new Error('Error deploying and adding message')
    }
  }

  async #addMessage(safeMessage: SafeMessage): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const threshold = await this.protocolKit.getThreshold()
    const signedMessage = await this.protocolKit.signMessage(safeMessage)
    const messageHash = await this.protocolKit.getSafeMessageHash(hashSafeMessage(safeMessage.data))

    await this.apiKit.addMessage(safeAddress, {
      message: safeMessage.data as any,
      signature: signedMessage.encodedSignatures()
    })

    const message = await this.apiKit.getMessage(messageHash)

    return createSafeClientResult({
      safeAddress: await this.protocolKit.getAddress(),
      status:
        message.confirmations.length === threshold
          ? SafeClientTxStatus.MESSAGE_CONFIRMED
          : SafeClientTxStatus.MESSAGE_PENDING_SIGNATURES,
      messageHash
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
