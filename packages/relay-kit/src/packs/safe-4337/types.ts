import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

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
  entryPoint?: string
  options: ExistingSafeOptions | PredictedSafeOptions
}

export type Safe4337Options = {
  protocolKit: Safe
  bundlerClient: ethers.JsonRpcProvider
  publicClient: ethers.JsonRpcProvider
  entryPoint: string
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

type Log = {
  logIndex: string
  transactionIndex: string
  transactionHash: string
  blockHash: string
  blockNumber: string
  address: string
  data: string
  topics: string[]
}

type Receipt = {
  transactionHash: string
  transactionIndex: string
  blockHash: string
  blockNumber: string
  from: string
  to: string
  cumulativeGasUsed: string
  gasUsed: string
  contractAddress: null
  logs: Log[]
  logsBloom: string
  status: string
  effectiveGasPrice: string
}

export type UserOperationReceipt = {
  userOpHash: string
  sender: string
  nonce: string
  actualGasUsed: string
  actualGasCost: string
  success: boolean
  logs: Log[]
  receipt: Receipt
}

export type UserOperationWithPayload = {
  userOperation: UserOperation
  entryPoint: string
  transactionHash: string
  blockHash: string
  blockNumber: string
}
