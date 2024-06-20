import Safe, { SafeProvider } from '@safe-global/protocol-kit'
import { TransactionBase, TransactionOptions } from '@safe-global/safe-core-sdk-types'

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
  chain: {
    hash?: string | undefined
  }
  safeServices?: {
    safeTxHash: string | undefined
  }
}

export type SafeClient = {
  protocolKit: Safe
  send: (
    transactions: TransactionBase[],
    options?: TransactionOptions
  ) => Promise<SafeClientTransactionResult>
  extend: <T>(extendFunc: (client: SafeClient) => T) => SafeClient & T
}
