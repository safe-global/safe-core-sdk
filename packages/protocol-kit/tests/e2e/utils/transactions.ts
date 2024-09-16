import { GetTransactionReceiptReturnType } from 'viem'
import { TransactionResult } from '@safe-global/types-kit'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<GetTransactionReceiptReturnType | null | undefined> {
  const receipt: GetTransactionReceiptReturnType | null | undefined =
    txResult.transactionResponse && (await txResult?.transactionResponse?.wait())

  return receipt
}
