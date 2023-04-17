import { BigNumberish } from '@ethersproject/bignumber'
import { ContractTransaction } from '@ethersproject/contracts'
import { BaseTransactionResult } from '@safe-global/safe-core-sdk-types'

export interface EthersTransactionOptions {
  from?: string
  gasLimit?: BigNumberish
  gasPrice?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  nonce?: BigNumberish
}

export interface EthersTransactionResult extends BaseTransactionResult {
  transactionResponse: ContractTransaction
  options?: EthersTransactionOptions
}
