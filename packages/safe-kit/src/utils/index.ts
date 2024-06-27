import { validateEthereumAddress } from '@safe-global/protocol-kit'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import { ContractTransactionReceipt, TransactionResponse } from 'ethers'
import { MESSAGES, SafeClientTxStatus } from '../constants'

import { SafeClientTransactionResult, SafeConfig } from '../types'

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

export const createTransactionResult = ({
  status,
  safeAddress,
  deploymentTxHash,
  safeTxHash,
  txHash
}: {
  status: SafeClientTxStatus
  safeAddress: string
  deploymentTxHash?: string
  safeTxHash?: string
  txHash?: string
}): SafeClientTransactionResult => {
  return {
    safeAddress,
    description: MESSAGES[status],
    status,
    safeTxHash,
    deployment: deploymentTxHash ? { txHash: deploymentTxHash } : undefined,
    execution: txHash ? { txHash } : undefined
  }
}

export * from './executeWithSigner'
export * from './proposeTransaction'
