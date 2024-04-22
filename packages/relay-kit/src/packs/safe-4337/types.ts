import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { MetaTransactionData, SafeVersion } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'
import SafeOperation from './SafeOperation'

type ExistingSafeOptions = {
  safeAddress: string
}

type PredictedSafeOptions = {
  owners: string[]
  threshold: number
  safeVersion?: SafeVersion
  saltNonce?: string
}

export type PaymasterOptions = {
  paymasterUrl?: string
  isSponsored?: boolean
  sponsorshipPolicyId?: string
  paymasterAddress: string
  paymasterTokenAddress?: string
  amountToApprove?: bigint
}

export type Safe4337InitOptions = {
  ethersAdapter: EthersAdapter
  bundlerUrl: string
  rpcUrl: string
  safeModulesVersion?: string
  customContracts?: {
    entryPointAddress?: string
    safe4337ModuleAddress?: string
    addModulesLibAddress?: string
  }
  options: ExistingSafeOptions | PredictedSafeOptions
  paymasterOptions?: PaymasterOptions
}

export type Safe4337Options = {
  protocolKit: Safe
  bundlerUrl: string
  paymasterOptions?: PaymasterOptions
  bundlerClient: ethers.JsonRpcProvider
  publicClient: ethers.JsonRpcProvider
  entryPointAddress: string
  safe4337ModuleAddress: string
}

export type Safe4337CreateTransactionProps = {
  transactions: MetaTransactionData[]
  options?: {
    amountToApprove?: bigint
    validUntil?: number
    validAfter?: number
    feeEstimator?: IFeeEstimator
  }
}

export type Safe4337ExecutableProps = {
  executable: SafeOperation
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
  validAfter: number
  validUntil: number
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

export type EstimateGasData = {
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  preVerificationGas?: bigint
  verificationGasLimit?: bigint
  callGasLimit?: bigint
}

export type EstimateSponsoredGasData = {
  paymasterAndData: string
} & EstimateGasData

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

export type EstimateFeeFunctionProps = {
  userOperation: UserOperation
  bundlerUrl: string
  entryPoint: string
}

export type EstimateFeeFunction = ({
  userOperation,
  bundlerUrl,
  entryPoint
}: EstimateFeeFunctionProps) => Promise<EstimateGasData>

export type EstimateSponsoredFeeFunctionProps = {
  userOperation: UserOperation
  paymasterUrl: string
  entryPoint: string
  sponsorshipPolicyId?: string
}

export type EstimateSponsoredFeeFunction = ({
  userOperation,
  paymasterUrl,
  entryPoint
}: EstimateSponsoredFeeFunctionProps) => Promise<EstimateSponsoredGasData>

export interface IFeeEstimator {
  setupEstimation?: EstimateFeeFunction
  adjustEstimation?: EstimateFeeFunction
  getPaymasterEstimation?: EstimateSponsoredFeeFunction
}

export type EstimateFeeProps = {
  safeOperation: SafeOperation
  feeEstimator?: IFeeEstimator
}
