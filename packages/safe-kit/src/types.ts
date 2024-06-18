import Safe, { SafeProvider } from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'

type SafeConfig = {
  owners: string[]
  threshold: number
  saltNonce?: string
}

type ExistingSafeKitConfig = {
  safeAddress?: string
  safeOptions?: never
}

type PredictedSafeKitConfig = {
  safeAddress?: never
  safeOptions?: SafeConfig
}

type SafeKitRootConfig = {
  provider: SafeProvider['provider']
  signer: SafeProvider['signer']
}

export type SafeKitConfig = SafeKitRootConfig & (ExistingSafeKitConfig | PredictedSafeKitConfig)

export type TransactionResult = {
  hash: string | undefined
}

export type SafeClient = {
  protocolKit: Safe
  send: (
    transactions: TransactionBase[],
    options?: TransactionOptions
  ) => Promise<TransactionResult>
  extend: <T>(extendFunc: (client: SafeClient) => T) => SafeClient & T
}
