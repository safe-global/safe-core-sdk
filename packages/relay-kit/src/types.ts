import Safe from '@safe-global/protocol-kit'
import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'

export interface RelayPack {
  getFeeCollector(): string
  getEstimateFee(chainId: number, gasLimit: string, gasToken?: string): Promise<string>
  getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined>
  createRelayedTransaction(
    safe: Safe,
    transactions: MetaTransactionData[],
    options: MetaTransactionOptions
  ): Promise<SafeTransaction>
  relayTransaction(transaction: RelayTransaction): Promise<RelayResponse>
}
