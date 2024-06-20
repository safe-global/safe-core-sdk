import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { SafeClientTransactionResult } from '../types'
import { SafeAccountClient } from '../SafeAccountClient'

/**
 * Sends a transaction using the SafeAccountClient client.
 *
 * @param {TransactionBase[]} transactions - An array of transactions to be sent.
 * @param {TransactionOptions} options - Options for executing the transaction.
 * @param {SafeAccountClient} safeClient - The SafeAccountClient client used to send the transaction.
 * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
 */
export const sendTransaction = async (
  transactions: TransactionBase[],
  options: TransactionOptions,
  safeClient: SafeAccountClient
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
