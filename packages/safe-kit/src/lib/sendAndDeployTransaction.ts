import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { SafeClientTransactionResult } from '../types'
import { SafeAccountClient } from '../SafeAccountClient'
import { AbstractSigner } from 'ethers'

/**
 * Sends a transaction using the SafeAccountClient client.
 *
 * @param {TransactionBase[]} transactions - An array of transactions to be sent.
 * @param {TransactionOptions} options - Options for executing the transaction.
 * @param {SafeAccountClient} safeClient - The SafeAccountClient client used to send the transaction.
 * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
 */
export const sendAndDeployTransaction = async (
  transactions: TransactionBase[],
  options: TransactionOptions,
  safeClient: SafeAccountClient
): Promise<SafeClientTransactionResult> => {
  let safeTransaction = await safeClient.protocolKit.createTransaction({ transactions })
  safeTransaction = await safeClient.protocolKit.signTransaction(safeTransaction)
  const transactionBatchWithDeployment =
    await safeClient.protocolKit.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

  const signer = (await safeClient.protocolKit
    .getSafeProvider()
    .getExternalSigner()) as unknown as AbstractSigner

  const txResponsePromise = await signer.sendTransaction({
    from: (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x',
    ...transactionBatchWithDeployment,
    ...options
  })

  const txResponse = await txResponsePromise.wait()

  return { chain: { hash: txResponse?.hash } }
}
