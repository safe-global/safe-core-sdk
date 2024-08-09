import { validateEthereumAddress } from '@safe-global/protocol-kit'
import { TransactionResult } from '@safe-global/safe-core-sdk-types'
import { ContractTransactionReceipt, TransactionResponse } from 'ethers'

import { MESSAGES, SafeClientTxStatus } from '@safe-global/sdk-starter-kit/constants'
import { SafeClientResult, SafeConfig } from '@safe-global/sdk-starter-kit/types'

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

export const createSafeClientResult = ({
  status,
  safeAddress,
  deploymentTxHash,
  safeTxHash,
  txHash,
  messageHash,
  userOperationHash,
  safeOperationHash
}: {
  status: SafeClientTxStatus
  safeAddress: string
  deploymentTxHash?: string
  safeTxHash?: string
  txHash?: string
  messageHash?: string
  userOperationHash?: string
  safeOperationHash?: string
}): SafeClientResult => {
  return {
    safeAddress,
    description: MESSAGES[status],
    status,
    transactions: txHash || safeTxHash ? { ethereumTxHash: txHash, safeTxHash } : undefined,
    messages: messageHash ? { messageHash } : undefined,
    safeOperations:
      userOperationHash || safeOperationHash ? { userOperationHash, safeOperationHash } : undefined,
    safeAccountDeployment: deploymentTxHash ? { ethereumTxHash: deploymentTxHash } : undefined
  }
}

export * from './sendTransaction'
export * from './proposeTransaction'
