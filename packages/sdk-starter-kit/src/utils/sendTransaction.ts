import Safe from '@safe-global/protocol-kit'
import { Transaction } from '@safe-global/safe-core-sdk-types'
import { AbstractSigner } from 'ethers'

/**
 * Sends a transaction using the signer (owner)
 * It's useful to deploy Safe accounts
 *
 * @param {Transaction} transaction  The transaction.
 * @param {Safe} protocolKit The protocolKit instance
 * @returns {Promise<string | undefined>} A promise that resolves with the transaction hash
 */
export const sendTransaction = async ({
  transaction,
  protocolKit
}: {
  transaction: Transaction
  protocolKit: Safe
}): Promise<string | undefined> => {
  const signer = (await protocolKit
    .getSafeProvider()
    .getExternalSigner()) as unknown as AbstractSigner
  const txResponsePromise = await signer.sendTransaction({
    from: (await protocolKit.getSafeProvider().getSignerAddress()) || '0x',
    ...transaction
  })

  const txResponse = await txResponsePromise.wait()

  return txResponse?.hash
}
