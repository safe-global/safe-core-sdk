import { validateEthereumAddress } from '@safe-global/protocol-kit'
import { SafeConfig } from '../types'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import { ContractTransactionReceipt, TransactionResponse } from 'ethers'

export const isValidAddress = (address: string): boolean => {
  try {
    validateEthereumAddress(address)
    return true
  } catch {
    return false
  }
}

export const isValidSafeConfig = (config: SafeConfig): boolean => {
  if (!config.owners || !config.threshold) return false

  return true
}

export const waitSafeTxReceipt = async (
  txResult: TransactionResult
): Promise<ContractTransactionReceipt | null | undefined> => {
  const receipt =
    txResult.transactionResponse &&
    (await (txResult.transactionResponse as TransactionResponse).wait())

  return receipt as ContractTransactionReceipt
}

export * from './executeWithSigner'
export * from './descriptions'
export * from './proposeTransaction'
