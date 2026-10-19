import Safe, { EthSafeSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { SafeTransaction } from '@safe-global/types-kit'

/**
 *  Propose a transaction to the Safe
 *
 * @param {SafeTransaction} safeTransaction The Safe transaction to propose
 * @param {Safe} protocolKit The Safe instance
 * @param {SafeApiKit} apiKit The SafeApiKit instance
 * @returns The Safe transaction hash
 */
export const proposeTransaction = async ({
  safeTransaction,
  protocolKit,
  apiKit
}: {
  safeTransaction: SafeTransaction
  protocolKit: Safe
  apiKit: SafeApiKit
}): Promise<string> => {
  safeTransaction = await protocolKit.signTransaction(safeTransaction)

  const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
  const ethSig = safeTransaction.getSignature(signerAddress) as EthSafeSignature

  const { safeTxHash } = await apiKit.proposeTransaction({
    safeAddress: await protocolKit.getAddress(),
    safeTransactionData: safeTransaction.data,
    senderSignature: buildSignatureBytes([ethSig])
  })

  return safeTxHash
}
