import { ContractTransactionResponse, Signer } from 'ethers'
import { EthersTransactionOptions, EthersTransactionResult } from '../types'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export function toTxResult(
  transactionResponse: ContractTransactionResponse,
  options?: EthersTransactionOptions
): EthersTransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse
  }
}

export function isTypedDataSigner(signer: any): signer is Signer {
  return (signer as unknown as Signer).signTypedData !== undefined
}
