import { SafeClientTransactionResult } from '../types'

export enum SafeClientTxStatus {
  DEPLOYED_AND_EXECUTED = 'DEPLOYED_AND_EXECUTED',
  DEPLOYED_AND_PENDING_SIGNATURES = 'DEPLOYED_AND_PENDING_SIGNATURES',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES'
}

export const DEPLOYED_AND_EXECUTED =
  'The transaction has been executed. A new Safe account was deployed, check the deployment property to see the Safe account information and deployment hash.'
export const EXECUTED = 'The transaction has been executed on-chain.'
export const FAILED = 'The transaction has failed.'
export const DEPLOYED_AND_PENDING_SIGNATURES =
  'A new Safe account was deployed, check the deployment property to see the Safe account information and deployment hash. The transaction was not executed on-chain yet. It was stored in the Safe services and you need to confirm it with other Safe owners first. Use the confirm(safeTxHash) method with other signer connected to the client.'
export const PENDING_SIGNATURES =
  'The transaction was not executed on-chain yet. It was stored in the Safe services and you need to confirm it with other Safe owners first. Use the confirm(safeTxHash) method with other signer connected to the client.'

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
  const txResult: SafeClientTransactionResult = {
    safeAddress,
    description: '',
    status,
    safeTxHash
  }

  switch (status) {
    case SafeClientTxStatus.DEPLOYED_AND_EXECUTED:
      txResult.description = DEPLOYED_AND_EXECUTED
      break
    case SafeClientTxStatus.DEPLOYED_AND_PENDING_SIGNATURES:
      txResult.description = DEPLOYED_AND_PENDING_SIGNATURES
      break
    case SafeClientTxStatus.EXECUTED:
      txResult.description = EXECUTED
      break
    case SafeClientTxStatus.FAILED:
      txResult.description = FAILED
      break
    case SafeClientTxStatus.PENDING_SIGNATURES:
      txResult.description = PENDING_SIGNATURES
      break
  }

  txResult.deployment = deploymentTxHash
    ? {
        txHash: deploymentTxHash
      }
    : undefined

  txResult.execution = txHash ? { txHash } : undefined

  return txResult
}
