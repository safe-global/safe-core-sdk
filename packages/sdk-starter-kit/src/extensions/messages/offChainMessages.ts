import { ListOptions, SafeMessageListResponse } from '@safe-global/api-kit'

import { SafeClient } from '@safe-global/sdk-starter-kit/SafeClient'
import { SafeMessageClient } from '@safe-global/sdk-starter-kit/extensions/messages/SafeMessageClient'
import {
  ConfirmOffChainMessageProps,
  SafeClientResult,
  SendOffChainMessageProps
} from '@safe-global/sdk-starter-kit/types'

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
 * const { messages } = await safeMessagesClient.sendOffChainMessage({ message })
 * await safeMessagesClient.confirmOffChainMessage({ messageHash: messages?.messageHash})
 */
export function offChainMessages() {
  return (client: SafeClient) => {
    const safeMessageClient = new SafeMessageClient(client.protocolKit, client.apiKit)

    return {
      /**
       * Creates an off-chain message using the Transaction service
       *
       * @param {SendOffChainMessageProps} props The message properties
       * @returns {Promise<SafeClientResult>} A SafeClientResult. You can get the messageHash to confirmMessage() afterwards from the messages property       */
      async sendOffChainMessage(props: SendOffChainMessageProps): Promise<SafeClientResult> {
        return safeMessageClient.sendMessage(props)
      },
      /**
       * Confirms an off-chain message using the Transaction service
       *
       * @param {ConfirmOffChainMessageProps} props The confirmation properties
       * @returns {Promise<SafeClientResult>} A SafeClientResult with the result of the confirmation
       */
      async confirmOffChainMessage(props: ConfirmOffChainMessageProps): Promise<SafeClientResult> {
        return safeMessageClient.confirmMessage(props)
      },
      /**
       * Get the list of pending off-chain messages. This messages can be confirmed using the confirmMessage() method
       *
       * @param {ListOptions} options The pagination options
       * @returns {Promise<SafeMessageListResponse>} A list of pending messages
       */
      async getPendingOffChainMessages(options?: ListOptions): Promise<SafeMessageListResponse> {
        return safeMessageClient.getPendingMessages(options)
      }
    }
  }
}
