import { hashSafeMessage } from '@safe-global/protocol-kit'
import {
  EIP712TypedData,
  OperationType,
  TransactionOptions
} from '@safe-global/safe-core-sdk-types'

import { SafeClient } from '@safe-global/safe-kit/SafeClient'
import { SafeClientResult } from '@safe-global/safe-kit/types'

/**
 * Extend the SafeClient with the ability to use on-chain messages
 * The on-chain messages are regular transactions created using the SignMessageLib so after sendMessage()
 * you can confirm the transaction using the safeTxHash anf the confirm() method for transactions
 *
 * @example
 * const safeClient = await createSafeClient({ ... })
 *
 * const safeMessageClient = await safeClient.extend(
 *   onChainMessages()
 * )
 *
 * const { transactions } = await safeMessageClient.sendMessage(...)
 * await safeMessageClient.confirm(transactions?.safeTxHash)
 */
export function onChainMessages() {
  return (client: SafeClient) => ({
    /**
     * Creates and sends a message as a regular transaction using the SignMessageLib contract
     * The message can be a string or an EIP712TypedData object
     * As this method creates a new transaction you can confirm it using the safeTxHash and the confirm() method and
     * retrieve the pending transactions using the getPendingTransactions() method from the general client
     * @param {string | EIP712TypedData} message The message to be sent
     * @param {TransactionOptions} options Optional transaction options
     * @returns {Promise<SafeClientResult>} A SafeClientResult. You can get the safeTxHash to confirm from the transaction property
     */
    async sendOnChainMessage(
      message: string | EIP712TypedData,
      options?: TransactionOptions
    ): Promise<SafeClientResult> {
      const signMessageLibContract = await client.protocolKit
        .getSafeProvider()
        .getSignMessageLibContract({
          safeVersion: await client.protocolKit.getContractVersion()
        })

      const transaction = {
        to: await signMessageLibContract.getAddress(),
        value: '0',
        data: signMessageLibContract.encode('signMessage', [hashSafeMessage(message)]),
        operation: OperationType.DelegateCall
      }

      return client.send([transaction], options)
    }
  })
}
