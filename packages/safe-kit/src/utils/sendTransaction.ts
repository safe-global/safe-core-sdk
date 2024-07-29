import { Address, WalletClient, Transport, Chain, Hex, Account } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import Safe from '@safe-global/protocol-kit'
import { Transaction } from '@safe-global/safe-core-sdk-types'

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
  const signer = (await protocolKit.getSafeProvider().getExternalSigner()) as WalletClient<
    Transport,
    Chain,
    Account
  >
  const client = await protocolKit.getSafeProvider().getExternalProvider()

  if (!signer)
    throw new Error('SafeProvider must be initialized with a signer to use this function')

  const hash = await signer.sendTransaction({
    to: transaction.to as Address,
    data: transaction.data as Hex,
    value: BigInt(transaction.value),
    account: signer.account
  })

  const receipt = await waitForTransactionReceipt(client, { hash })

  return receipt.transactionHash
}
