import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { AbstractSigner } from 'ethers'

/**
 * Sends a transaction using the signer (owner)
 * It's useful to deploy Safe accounts
 *
 * @param {TransactionBase} transaction  The transaction.
 * @param {TransactionOptions} options Options for executing the transaction.
 * @param {Safe} protocolKit The protocolKit instance
 * @returns {Promise<string | undefined>} A promise that resolves with the transaction hash
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
