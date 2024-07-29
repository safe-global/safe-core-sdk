import { hashSafeMessage } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/safe-core-sdk-types'

import { SafeClient } from '@safe-global/safe-kit/SafeClient'
import { SafeClientResult, SendOnChainMessageProps } from '@safe-global/safe-kit/types'
import { Hash } from 'viem'

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
 * const { transactions } = await safeMessageClient.sendOnChainMessage({ message })
 * await safeMessageClient.confirm({ safeTxHash: transactions?.safeTxHash})
 */
export function onChainMessages() {
  return (client: SafeClient) => ({
    /**
     * Creates and sends a message as a regular transaction using the SignMessageLib contract
     * The message can be a string or an EIP712TypedData object
     * As this method creates a new transaction you can confirm it using the safeTxHash and the confirm() method and
     * retrieve the pending transactions using the getPendingTransactions() method from the general client
     * @param {SendOnChainMessageProps} props The message properties
     * @returns {Promise<SafeClientResult>} A SafeClientResult. You can get the safeTxHash to confirm from the transaction property
     */
    async sendOnChainMessage(props: SendOnChainMessageProps): Promise<SafeClientResult> {
      const { message, ...transactionOptions } = props

      const signMessageLibContract = await client.protocolKit
        .getSafeProvider()
        .getSignMessageLibContract({
          safeVersion: await client.protocolKit.getContractVersion()
        })

      const transaction = {
        to: signMessageLibContract.getAddress(),
        value: '0',
        data: signMessageLibContract.encode('signMessage', [hashSafeMessage(message) as Hash]),
        operation: OperationType.DelegateCall
      }

      return client.send({ transactions: [transaction], ...transactionOptions })
    }
  })
}
