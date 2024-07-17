import Safe from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import { Address, WalletClient, Transport, Chain, Hex } from 'viem'
/**
 * Sends a transaction using the signer (owner)
 * It's useful to deploy Safe accounts
 *
 * @param {TransactionBase} transaction  The transaction.
 * @param {TransactionOptions} options Options for executing the transaction.
 * @param {Safe} protocolKit The protocolKit instance
 * @returns {Promise<string | undefined>} A promise that resolves with the transaction hash
 * @throws
 */
export const sendTransaction = async (
  transaction: TransactionBase,
  options: TransactionOptions,
  protocolKit: Safe
): Promise<string | undefined> => {
  const signer = (await protocolKit.getSafeProvider().getExternalSigner()) as WalletClient<
    Transport,
    Chain
  >
  const client = await protocolKit.getSafeProvider().getExternalProvider()

  const account = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
  if (!signer)
    throw new Error('SafeProvider must be initialized with a signer to use this function')
  const hash = await signer.sendTransaction({
    account: account as Address,
    to: transaction.to as Address,
    data: transaction.data as Hex,
    value: BigInt(transaction.value),
    ...createLegacyTxOptions(options)
  })

  const receipt = await client.waitForTransactionReceipt({ hash })

  return receipt.transactionHash
}

export function createLegacyTxOptions(options?: TransactionOptions) {
  const converted: any = {}
  if (options?.from) {
    converted.account = options.from as Address
  }

  if (options?.gasLimit) {
    converted.gas = BigInt(options.gasLimit)
  }

  if (options?.gasPrice) {
    converted.gasPrice = BigInt(options.gasPrice)
  }

  if (options?.nonce) {
    converted.nonce = options.nonce
  }

  if (options?.maxFeePerGas) {
    converted.maxFeePerGas = BigInt(options.maxFeePerGas)
  }

  if (options?.maxPriorityFeePerGas) {
    converted.maxPriorityFeePerGas = BigInt(options.maxPriorityFeePerGas)
  }

  return converted
}
