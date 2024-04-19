import { ContractTransactionReceipt } from 'ethers'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'
import { TransactionReceipt } from 'web3-core/types'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<ContractTransactionReceipt | TransactionReceipt | undefined> {
  const receipt: ContractTransactionReceipt | TransactionReceipt | undefined = txResult.promiEvent
    ? await new Promise(
        (resolve, reject) =>
          txResult.promiEvent &&
          txResult.promiEvent
            .on('confirmation', (_confirmationNumber: any, receipt: TransactionReceipt) =>
              resolve(receipt)
            )
            .catch(reject)
      )
    : txResult.transactionResponse && (await txResult.transactionResponse.wait())
  return receipt
}

export async function getTransaction(
  safeProvider: SafeProvider,
  transactionHash: string
): Promise<any> {
  return safeProvider.getTransaction(transactionHash)
}
