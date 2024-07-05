import { GetTransactionReceiptReturnType } from 'viem'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<GetTransactionReceiptReturnType | null | undefined> {
  const receipt: GetTransactionReceiptReturnType | null | undefined =
    txResult.transactionResponse && (await txResult?.transactionResponse?.wait())

  return receipt
}

export async function getTransaction(
  safeProvider: SafeProvider,
  transactionHash: string
): Promise<any> {
  return safeProvider.getTransaction(transactionHash)
}
