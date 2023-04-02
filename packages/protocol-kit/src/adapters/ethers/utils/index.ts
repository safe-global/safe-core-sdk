import { TypedDataSigner } from '@ethersproject/abstract-signer'
import { ContractTransaction } from '@ethersproject/contracts'
import { EthersTransactionOptions, EthersTransactionResult } from '../types'
import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'

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

export function isTypedDataSigner(signer: any): signer is TypedDataSigner {
  return (signer as unknown as TypedDataSigner)._signTypedData !== undefined
}

/**
 * Check if the signerOrProvider is compatible with `Signer`
 * @param signerOrProvider - Signer or provider
 * @returns true if the parameter is compatible with `Signer`
 */
export function isSignerCompatible(
  signerOrProvider: Signer | Provider
): signerOrProvider is Signer {
  const candidate = signerOrProvider as Signer
  return (
    (typeof candidate.signMessage === 'function' &&
      typeof candidate.signTransaction === 'function' &&
      candidate._isSigner) ||
    candidate instanceof Signer
  )
}
