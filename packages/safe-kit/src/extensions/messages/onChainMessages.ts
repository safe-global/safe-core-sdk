import { hashSafeMessage } from '@safe-global/protocol-kit'
import {
  EIP712TypedData,
  OperationType,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'

import { SafeClient } from '../../SafeClient'
import { SafeClientResult } from '../../types'

/**
 * A function to extend the SafeClient with the ability to send on-chain messages.
 */
export function onChainMessages() {
  return (client: SafeClient) => ({
    async sendMessage(
      message: string | EIP712TypedData,
      options?: TransactionOptions
    ): Promise<SafeClientResult> {
      const signMessageLibContract = await client.protocolKit
        .getSafeProvider()
        .getSignMessageLibContract({
          safeVersion: await client.protocolKit.getContractVersion()
        })

      const messageHash = hashSafeMessage(message)

      const txData = signMessageLibContract.encode('signMessage', [messageHash])

      const transaction = {
        to: await signMessageLibContract.getAddress(),
        value: '0',
        data: txData,
        operation: OperationType.DelegateCall
      }

      return client.send([transaction], options)
    }
  })
}
