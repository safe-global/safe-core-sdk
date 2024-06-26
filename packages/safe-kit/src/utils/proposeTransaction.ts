import { SafeTransaction } from 'packages/safe-core-sdk-types/dist/src'
import { SafeClient } from '../SafeClient'
import { EthSafeSignature, buildSignatureBytes } from 'packages/protocol-kit/dist/src'

export const proposeTransaction = async (
  safeTransaction: SafeTransaction,
  safeClient: SafeClient
): Promise<string> => {
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
