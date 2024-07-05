import { GetSafeMessageListProps, SafeMessageListResponse } from '@safe-global/api-kit'
import { EIP712TypedData } from '@safe-global/safe-core-sdk-types'

import { SafeClient } from '@safe-global/safe-kit/SafeClient'
import { SafeMessageClient } from '@safe-global/safe-kit/extensions/messages/SafeMessageClient'
import { SafeClientResult } from '@safe-global/safe-kit/types'

/**
 * Extend the SafeClient with the ability to use off-chain messages
 *
 * @example
 * const safeClient = await createSafeClient({ ... })
 *
 * const safeMessagesClient = await safeClient.extend(
 *   offChainMessages()
 * )
 *
 * const { messages } = await safeMessagesClient.sendMessage(...)
 * await safeMessagesClient.confirm(messages?.messageHash)
 */
export function offChainMessages() {
  return (client: SafeClient) => {
    const safeMessageClient = new SafeMessageClient(client.protocolKit, client.apiKit)

    return {
      /**
       * Creates an off-chain message using the Transaction service
       *
       * @param {string | EIP712TypedData} message The message to be sent, can be a raw string or an EIP712TypedData object
       * @returns {Promise<SafeClientResult>} A SafeClientResult. You can get the messageHash to confirmMessage() afterwards from the messages property
       */
      async sendOffChainMessage(message: string | EIP712TypedData): Promise<SafeClientResult> {
        return safeMessageClient.sendMessage(message)
      },
      /**
       * Confirms an off-chain message using the Transaction service
       *
       * @param {string} messageHash The messageHash. Returned from the sendMessage() method inside the SafeClientResult messages property
       * @returns {Promise<SafeClientResult>} A SafeClientResult with the result of the confirmation
       */
      async confirmOffChainMessage(messageHash: string): Promise<SafeClientResult> {
        return safeMessageClient.confirmMessage(messageHash)
      },
      /**
       * Get the list of pending off-chain messages. This messages can be confirmed using the confirmMessage() method
       *
       * @param {GetSafeMessageListProps} [options] Optional query parameters for pagination
       * @returns {Promise<SafeMessageListResponse>} A list of pending messages
       */
      async getPendingOffChainMessages(
        options?: GetSafeMessageListProps
      ): Promise<SafeMessageListResponse> {
        return safeMessageClient.getPendingMessages(options)
      }
    }
  }
}
