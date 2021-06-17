import { ContractReceipt } from 'ethers/lib/ethers'
import { TransactionReceipt } from 'web3-core/types'
import { TransactionResult } from '../../src/utils/transactions/types'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<ContractReceipt | TransactionReceipt> {
  let receipt: ContractReceipt | TransactionReceipt
  if (txResult.promiEvent) {
    receipt = await new Promise(
      (resolve, reject) =>
        txResult.promiEvent &&
        txResult.promiEvent
          .on('confirmation', (_confirmationNumber: any, receipt: TransactionReceipt) =>
            resolve(receipt)
          )
          .catch(reject)
    )
  }
  if (txResult.transactionResponse) {
    receipt = await txResult.transactionResponse.wait()
  }
  return receipt
}
