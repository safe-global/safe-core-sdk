import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk'
import Safe from '@safe-global/safe-core-sdk'
import { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { BigNumber } from 'ethers'

// TO-DO: Duplicated. Remove local type and import from "types" package
// {

export interface MetaTransactionOptions {
  gasLimit: BigNumber
  gasToken?: string
  isSponsored?: boolean
}

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

export interface RelayTransaction {
  target: string
  encodedTransaction: string
  chainId: number
  options: MetaTransactionOptions
}

// }
// TO-DO: Duplicated. Remove local type and import from "types" package
