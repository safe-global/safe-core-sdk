import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

type ExistingSafeOptions = {
  safeAddress: string
}

type PredictedSafeOptions = {
  owners: string[]
  threshold: number
  safeVersion?: SafeVersion
  saltNonce?: string
}

export type Safe4337InitOptions = {
  ethersAdapter: EthersAdapter
  bundlerUrl: string
  paymasterUrl?: string
  rpcUrl: string
  options: ExistingSafeOptions | PredictedSafeOptions
}

export type Safe4337Options = {
  protocolKit: Safe
  bundlerUrl: string
  paymasterUrl?: string
  rpcUrl: string
}

export type SafeUserOperation = {
  safe: string
  nonce: bigint
  initCode: string
  callData: string
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: string
  validAfter: bigint
  validUntil: bigint
  entryPoint: string
}

export type UserOperation = {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: string
  signature: string
}

export type EstimateUserOperationGas = {
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
}

export type FeeData = {
  gasPrice: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}
