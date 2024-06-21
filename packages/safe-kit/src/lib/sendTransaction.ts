import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { SafeClientTransactionResult } from '../types'
import { SafeClient } from '../SafeClient'

/**
 * Sends a transaction using the SafeClient client.
 *
 * @param {TransactionBase[]} transactions - An array of transactions to be sent.
 * @param {TransactionOptions} options - Options for executing the transaction.
 * @param {SafeClient} safeClient - The SafeClient client used to send the transaction.
 * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
 */
export const sendTransaction = async (
  transactions: TransactionBase[],
  options: TransactionOptions,
  safeClient: SafeClient
): Promise<SafeClientTransactionResult> => {
  let safeTransaction = await safeClient.protocolKit.createTransaction({ transactions })
  safeTransaction = await safeClient.protocolKit.signTransaction(safeTransaction)

  const { hash } = await safeClient.protocolKit.executeTransaction(safeTransaction, options)

  return {
    chain: {
      hash
    }
  }
}
