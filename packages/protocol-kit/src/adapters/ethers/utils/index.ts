import { ContractTransactionResponse, Provider, AbstractSigner } from 'ethers'
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

export function isTypedDataSigner(signer: any): signer is AbstractSigner {
  return (signer as unknown as AbstractSigner).signTypedData !== undefined
}

/**
 * Check if the signerOrProvider is compatible with `Signer`
 * @param signerOrProvider - Signer or provider
 * @returns true if the parameter is compatible with `Signer`
 */
export function isSignerCompatible(signerOrProvider: AbstractSigner | Provider): boolean {
  const candidate = signerOrProvider as AbstractSigner

  const isSigntransactionCompatible = typeof candidate.signTransaction === 'function'
  const isSignMessageCompatible = typeof candidate.signMessage === 'function'
  const isGetAddressCompatible = typeof candidate.getAddress === 'function'

  return isSigntransactionCompatible && isSignMessageCompatible && isGetAddressCompatible
}
