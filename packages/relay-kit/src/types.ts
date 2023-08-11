import Safe from '@safe-global/protocol-kit'
import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  RelayTransaction,
  SafeTransaction
} from '@safe-global/safe-core-sdk-types'

export interface CreateTransactionProps {
  safe: Safe
  /** transactions - The transaction array to process */
  transactions: MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: MetaTransactionOptions
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}

export interface RelayPack {
  getFeeCollector(): string
  getEstimateFee(chainId: number, gasLimit: string, gasToken?: string): Promise<string>
  getTaskStatus(taskId: string): Promise<TransactionStatusResponse | undefined>
  createRelayedTransaction({
    safe,
    transactions,
    options,
    onlyCalls
  }: CreateTransactionProps): Promise<SafeTransaction>
  relayTransaction(transaction: RelayTransaction): Promise<RelayResponse>
  executeRelayTransaction(
    safeTransaction: SafeTransaction,
    safe: Safe,
    options?: MetaTransactionOptions
  ): Promise<RelayResponse>
}
