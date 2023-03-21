import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk'
import Safe from '@safe-global/safe-core-sdk'
import { MetaTransactionData, MetaTransactionOptions, RelayTransaction, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { BigNumber } from 'ethers'

export interface RelayAdapter {
  getFeeCollector(): string
  getEstimateFee(chainId: number, gasLimit: BigNumber, gasToken?: string): Promise<BigNumber>
  getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined>
  createRelayedTransaction(
    safe: Safe,
    transactions: MetaTransactionData[],
    options: MetaTransactionOptions
  ): Promise<SafeTransaction>
  relayTransaction(transaction: RelayTransaction): Promise<RelayResponse>
}
