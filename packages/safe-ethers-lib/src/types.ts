import { ContractTransaction } from '@ethersproject/contracts'
import { BaseTransactionResult } from '@gnosis.pm/safe-core-sdk-types'

export interface EthersTransactionOptions {
  from?: string
  gasLimit?: number | string
  gasPrice?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export interface EthersTransactionResult extends BaseTransactionResult {
  transactionResponse: ContractTransaction
  options?: EthersTransactionOptions
}
