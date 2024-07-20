import { SafeProvider } from '@safe-global/protocol-kit'
import {
  TransactionBase,
  TransactionOptions,
  EIP712TypedData,
  MetaTransactionData
} from '@safe-global/safe-core-sdk-types'
import { IFeeEstimator } from '@safe-global/relay-kit'
import { SafeClientTxStatus } from '@safe-global/safe-kit/constants'

export type SendTransactionProps = {
  transactions: TransactionBase[]
} & TransactionOptions

export type ConfirmTransactionProps = {
  safeTxHash: string
}

export type SendOnChainMessageProps = {
  message: string | EIP712TypedData
} & TransactionOptions

export type SendOffChainMessageProps = {
  message: string | EIP712TypedData
}

export type ConfirmOffChainMessageProps = {
  messageHash: string
}

export type SendSafeOperationProps = {
  transactions: MetaTransactionData[]
  amountToApprove?: bigint
  validUntil?: number
  validAfter?: number
  feeEstimator?: IFeeEstimator
}

export type ConfirmSafeOperationProps = {
  safeOperationHash: string
}

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
