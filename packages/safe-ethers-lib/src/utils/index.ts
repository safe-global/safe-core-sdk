import { ContractTransaction } from '@ethersproject/contracts'
import { EthersTransactionOptions, EthersTransactionResult } from '../types'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export function toTxResult(
  transactionResponse: ContractTransaction,
  options?: EthersTransactionOptions
): EthersTransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse
  }
}
