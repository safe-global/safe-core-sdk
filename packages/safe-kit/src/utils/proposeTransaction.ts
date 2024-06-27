import { EthSafeSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { SafeClient } from '../SafeClient'

export const proposeTransaction = async (
  safeTransaction: SafeTransaction,
  safeClient: SafeClient
): Promise<string> => {
  safeTransaction = await safeClient.protocolKit.signTransaction(safeTransaction)

  const signerAddress = (await safeClient.protocolKit.getSafeProvider().getSignerAddress()) || '0x'
  const ethSig = safeTransaction.getSignature(signerAddress) as EthSafeSignature
  const safeTxHash = await safeClient.protocolKit.getTransactionHash(safeTransaction)

  const txOptions = {
    safeAddress: await safeClient.protocolKit.getAddress(),
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: buildSignatureBytes([ethSig])
  }

  await safeClient.apiKit.proposeTransaction(txOptions)

  return safeTxHash
}
