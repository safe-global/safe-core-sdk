import { SafeProvider } from '@safe-global/protocol-kit'
import { SafeClientTxStatus } from './utils'

export type SafeConfig = {
  owners: string[]
  threshold: number
  saltNonce?: string
}

export type ExistingSafeKitConfig = {
  safeAddress?: string
  safeOptions?: never
}

export type PredictedSafeKitConfig = {
  safeAddress?: never
  safeOptions?: SafeConfig
}

export type SafeKitRootConfig = {
  provider: SafeProvider['provider']
  signer: SafeProvider['signer']
}

export type SafeKitConfig = SafeKitRootConfig & (ExistingSafeKitConfig | PredictedSafeKitConfig)

export type SafeClientTransactionResult = {
  description: string
  status: SafeClientTxStatus
  deployment?: {
    safeAddress: string
    deploymentTxHash: string
  }
  txHash?: string
  safeTxHash?: string
}
