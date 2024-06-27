import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { SafeClient } from '../SafeClient'
import { AbstractSigner } from 'ethers'

/**
 * Sends a transaction using the SafeClient client.
 *
 * @param {TransactionBase[]} transactions - An array of transactions to be sent.
 * @param {TransactionOptions} options - Options for executing the transaction.
 * @param {SafeClient} safeClient - The SafeClient client used to send the transaction.
 * @returns {Promise<SafeClientTransactionResult>} A promise that resolves to the result of the transaction.
 */
export const sendTransaction = async (
  transaction: TransactionBase,
  options: TransactionOptions,
  safeClient: SafeClient
): Promise<string | undefined> => {
  const signer = (await safeClient.protocolKit
    .getSafeProvider()
    .getExternalSigner()) as unknown as AbstractSigner

  const txResponsePromise = await signer.sendTransaction({
    from: (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x',
    ...transaction,
    ...options
  })

  const txResponse = await txResponsePromise.wait()

  return txResponse?.hash
}
