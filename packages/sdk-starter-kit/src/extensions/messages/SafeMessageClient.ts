import Safe, { hashSafeMessage } from '@safe-global/protocol-kit'
import SafeApiKit, {
  EIP712TypedData as ApiKitEIP712TypedData,
  ListOptions,
  SafeMessageListResponse
} from '@safe-global/api-kit'
import { SafeMessage } from '@safe-global/types-kit'
import { createSafeClientResult, sendTransaction } from '@safe-global/sdk-starter-kit/utils'
import { SafeClientTxStatus } from '@safe-global/sdk-starter-kit/constants'
import {
  ConfirmOffChainMessageProps,
  SafeClientResult,
  SendOffChainMessageProps
} from '@safe-global/sdk-starter-kit/types'

/**
 * @class
 * This class provides the functionality to create and confirm off-chain messages
 */
export class SafeMessageClient {
  protocolKit: Safe
  apiKit: SafeApiKit

  /**
   * @constructor
   * @param {Safe} protocolKit A Safe instance
   * @param {SafeApiKit} apiKit A SafeApiKit instance
   */
  constructor(protocolKit: Safe, apiKit: SafeApiKit) {
    this.protocolKit = protocolKit
    this.apiKit = apiKit
  }

  /**
   * Send off-chain messages using the Transaction service
   *
   * @param {SendOffChainMessageProps} props The message properties
   * @param {string | EIP712TypedData} props.message The message to be sent. Can be a raw string or an EIP712TypedData object
   * @returns {Promise<SafeClientResult>} A SafeClientResult. You can get the messageHash to confirmMessage() afterwards from the messages property
   */
  async sendMessage({ message }: SendOffChainMessageProps): Promise<SafeClientResult> {
    const isSafeDeployed = await this.protocolKit.isSafeDeployed()
    const safeMessage = this.protocolKit.createMessage(message)

    if (isSafeDeployed) {
      return this.#addMessage({ safeMessage })
    } else {
      return this.#deployAndAddMessage({ safeMessage })
    }
  }

  /**
   * Confirms an off-chain message using the Transaction service
   *
   * @param {ConfirmOffChainMessageProps} props The confirmation properties
   * @param {string} props.messageHash The messageHash. Returned from the sendMessage() method inside the SafeClientResult messages property
   * @returns {Promise<SafeClientResult>} A SafeClientResult with the result of the confirmation
   */
  async confirmMessage({ messageHash }: ConfirmOffChainMessageProps): Promise<SafeClientResult> {
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
   * Get the list of pending off-chain messages. This messages can be confirmed using the confirmMessage() method
   *
   * @param {ListOptions} options The pagination options
   * @returns {Promise<SafeMessageListResponse>} A list of pending messages
   */
  async getPendingMessages(options?: ListOptions): Promise<SafeMessageListResponse> {
    const safeAddress = await this.protocolKit.getAddress()

    return this.apiKit.getMessages(safeAddress, options)
  }

  /**
   * Deploys a new Safe account based on the provided config and adds a message using the Transaction service
   * - If the Safe threshold > 1, we need to deploy the Safe account first and afterwards add the message
   *   The message should be confirmed with other owners using the confirmMessage() method until the threshold is reached in order to be valid
   * - If the threshold = 1, we can deploy the Safe account and add the message in one step. The message will be valid immediately
   *
   * @param {SafeTransaction} safeMessage  The safe message
   * @returns {Promise<SafeClientResult>} The SafeClientResult
   */
  async #deployAndAddMessage({
    safeMessage
  }: {
    safeMessage: SafeMessage
  }): Promise<SafeClientResult> {
    let deploymentTxHash
    const threshold = await this.protocolKit.getThreshold()
    const safeDeploymentTransaction = await this.protocolKit.createSafeDeploymentTransaction()

    try {
      deploymentTxHash = await sendTransaction({
        transaction: safeDeploymentTransaction,
        protocolKit: this.protocolKit
      })
      await this.#updateProtocolKitWithDeployedSafe()
    } catch (error) {
      throw new Error('Could not deploy the Safe account')
    }

    try {
      const { messages } = await this.#addMessage({ safeMessage })
      const messageResponse = await this.apiKit.getMessage(messages?.messageHash || '0x')

      return createSafeClientResult({
        safeAddress: await this.protocolKit.getAddress(),
        status:
          messageResponse.confirmations.length === threshold
            ? SafeClientTxStatus.DEPLOYED_AND_MESSAGE_CONFIRMED
            : SafeClientTxStatus.DEPLOYED_AND_MESSAGE_PENDING_SIGNATURES,
        deploymentTxHash,
        messageHash: messages?.messageHash
      })
    } catch (error) {
      throw new Error('Could not add a new off-chain message to the Safe account')
    }
  }

  /**
   * Add a new off-chain message using the Transaction service
   * - If the threshold > 1, remember to confirmMessage() after sendMessage()
   * - If the threshold = 1, then the message is confirmed and valid immediately
   *
   * @param {SafeMessage} safeMessage The message
   * @returns {Promise<SafeClientResult>} The SafeClientResult
   */
  async #addMessage({ safeMessage }: { safeMessage: SafeMessage }): Promise<SafeClientResult> {
    const safeAddress = await this.protocolKit.getAddress()
    const threshold = await this.protocolKit.getThreshold()
    const signedMessage = await this.protocolKit.signMessage(safeMessage)
    const messageHash = await this.protocolKit.getSafeMessageHash(hashSafeMessage(safeMessage.data))

    try {
      await this.apiKit.addMessage(safeAddress, {
        message: safeMessage.data as string | ApiKitEIP712TypedData,
        signature: signedMessage.encodedSignatures()
      })
    } catch (error) {
      throw new Error('Could not add a new off-chain message to the Safe account')
    }

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

  /**
   * This method updates the Safe instance with the deployed Safe account
   */
  async #updateProtocolKitWithDeployedSafe(): Promise<void> {
    this.protocolKit = await this.protocolKit.connect({
      provider: this.protocolKit.getSafeProvider().provider,
      signer: this.protocolKit.getSafeProvider().signer,
      safeAddress: await this.protocolKit.getAddress()
    })
  }
}
