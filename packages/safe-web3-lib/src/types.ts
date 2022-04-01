import { BaseTransactionResult } from '@gnosis.pm/safe-core-sdk-types'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'

export interface Web3TransactionOptions {
  from?: string
  gas?: number | string
  gasPrice?: number | string
}

export interface Web3TransactionResult extends BaseTransactionResult {
  promiEvent: PromiEvent<TransactionReceipt>
  options?: Web3TransactionOptions
}
