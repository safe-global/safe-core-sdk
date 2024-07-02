import { SafeMessageListResponse } from '@safe-global/api-kit'
import { EIP712TypedData } from '@safe-global/safe-core-sdk-types'
import { SafeClient } from '../../SafeClient'
import { SafeMessageClient } from './SafeMessageClient'

import { SafeClientResult } from '../../types'

/**
 * A function to extend the SafeClient with the ability to send off-chain messages.
 */
export function offChainMessages() {
  return (client: SafeClient) => {
    const safeMessageClient = new SafeMessageClient(client.protocolKit, client.apiKit)

    return {
      async sendMessage(message: string | EIP712TypedData): Promise<SafeClientResult> {
        return safeMessageClient.sendMessage(message)
      },
      async confirmMessage(messageHash: string): Promise<SafeClientResult> {
        return safeMessageClient.confirmMessage(messageHash)
      },
      async getPendingMessages(): Promise<SafeMessageListResponse> {
        return safeMessageClient.getPendingMessages()
      }
    }
  }
}
