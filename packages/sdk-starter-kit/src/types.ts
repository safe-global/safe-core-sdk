import { SafeProvider } from '@safe-global/protocol-kit'
import {
  TransactionBase,
  TransactionOptions,
  EIP712TypedData,
  MetaTransactionData
} from '@safe-global/types-kit'
import { IFeeEstimator } from '@safe-global/relay-kit'
import { SafeClientTxStatus } from '@safe-global/sdk-starter-kit/constants'

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

export type ExistingSafeConfig = {
  safeAddress?: string
  safeOptions?: never
}

export type PredictedSafeConfig = {
  safeAddress?: never
  safeOptions?: SafeConfig
}

export type SdkStarterKitRootConfig = {
  provider: SafeProvider['provider']
  signer?: SafeProvider['signer']
  txServiceUrl?: string
}

export type SdkStarterKitConfig = SdkStarterKitRootConfig &
  (ExistingSafeConfig | PredictedSafeConfig)

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

export type ChangeThresholdTxParams = {
  threshold: number
}
