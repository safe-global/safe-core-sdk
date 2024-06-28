import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { AbstractSigner } from 'ethers'

/**
 * Sends a transaction using the SafeClient client.
 *
 * @param {TransactionBase} transactions - An array of transactions to be sent.
 * @param {TransactionOptions} options - Options for executing the transaction.
 * @param {Safe} protocolKit - The protocolKit instance .
 * @returns {Promise<SafeClientResult>} A promise that resolves to the result of the transaction.
 */
export const sendTransaction = async (
  transaction: TransactionBase,
  options: TransactionOptions,
  protocolKit: Safe
): Promise<string | undefined> => {
  const signer = (await protocolKit
    .getSafeProvider()
    .getExternalSigner()) as unknown as AbstractSigner
  const txResponsePromise = await signer.sendTransaction({
    from: (await protocolKit.getSafeProvider().getSignerAddress()) || '0x',
    ...transaction,
    ...options
  })

  const txResponse = await txResponsePromise.wait()

  return txResponse?.hash
}
