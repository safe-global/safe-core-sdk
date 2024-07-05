import { SafeProvider } from '@safe-global/protocol-kit'
import { SafeClientTxStatus } from '@safe-global/safe-kit/constants'

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

export type SafeClientResult = {
  safeAddress: string
  description: string
  status: SafeClientTxStatus
  transactions?: {
    safeTxHash?: string
    ethereumTxHash?: string
  }
  messages?: {
    messageHash?: string
  }
  safeOperations?: {
    userOperationHash?: string
    safeOperationHash?: string
  }
  safeAccountDeployment?: {
    ethereumTxHash?: string
  }
}
