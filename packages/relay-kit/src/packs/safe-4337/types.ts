import Safe from '@safe-global/protocol-kit'
import { SafeSignature } from '@safe-global/safe-core-sdk-types'

export type Safe4337Options = {
  protocolKit: Safe
  bundlerUrl: string
  paymasterUrl?: string
  rpcUrl: string
}

export interface SafeOperation {
  readonly data: SafeUserOperation
  readonly signatures: Map<string, SafeSignature>
  getSignature(signer: string): SafeSignature | undefined
  addSignature(signature: SafeSignature): void
  encodedSignatures(): string
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
