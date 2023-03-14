import { ContractReceipt } from '@ethersproject/contracts'
import { EthAdapter, TransactionResult } from '@safe-global/safe-core-sdk-types'
import { TransactionReceipt } from 'web3-core/types'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<ContractReceipt | TransactionReceipt | undefined> {
  const receipt: ContractReceipt | TransactionReceipt | undefined = txResult.promiEvent
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
  ethAdapter: EthAdapter,
  transactionHash: string
): Promise<any> {
  return ethAdapter.getTransaction(transactionHash)
}
