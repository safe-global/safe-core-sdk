import { SafeProvider } from '@safe-global/protocol-kit'

type SafeConfig = {
  owners: string[]
  threshold: number
  saltNonce?: string
}

type ExistingSafeKitConfig = {
  provider: SafeProvider['provider']
  signer: SafeProvider['signer']
  safeAddress: string
  safeConfig: never
}

type PredictedSafeKitConfig = {
  provider: SafeProvider['provider']
  signer: SafeProvider['signer']
  safeAddress: never
  safeConfig: SafeConfig
}

type SafeKitRootConfig = {
  provider: SafeProvider['provider']
  signer: SafeProvider['signer']
}

export type SafeKitConfig = SafeKitRootConfig & (ExistingSafeKitConfig | PredictedSafeKitConfig)
