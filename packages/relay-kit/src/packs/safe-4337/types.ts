import { Account, Address, Chain, Hash, Hex, PublicClient, PublicRpcSchema, Transport } from 'viem'
import Safe, {
  DeploymentType,
  SafeProviderConfig,
  OnchainAnalyticsProps
} from '@safe-global/protocol-kit'
import {
  EstimateGasData,
  MetaTransactionData,
  SafeOperationResponse,
  SafeVersion,
  UserOperation
} from '@safe-global/types-kit'
import EthSafeOperation from './SafeOperation'
import { RPC_4337_CALLS } from './constants'

type ExistingSafeOptions = {
  safeAddress: string
}

type PredictedSafeOptions = {
  owners: string[]
  threshold: number
  safeVersion?: SafeVersion
  saltNonce?: string
  deploymentType?: DeploymentType
}

export type SponsoredPaymasterOption = {
  isSponsored: true
  paymasterUrl: string
  sponsorshipPolicyId?: string
}

export type ERC20PaymasterOption = {
  paymasterUrl: string
  isSponsored?: false
  paymasterAddress: string
  paymasterTokenAddress: string
  amountToApprove?: bigint
}

export type PaymasterOptions = SponsoredPaymasterOption | ERC20PaymasterOption | undefined

export type Safe4337InitOptions = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  bundlerUrl: string
  safeModulesVersion?: string
  customContracts?: {
    entryPointAddress?: string
    safe4337ModuleAddress?: string
    safeModulesSetupAddress?: string
    safeWebAuthnSharedSignerAddress?: string
  }
  options: ExistingSafeOptions | PredictedSafeOptions
  paymasterOptions?: PaymasterOptions
  onchainAnalytics?: OnchainAnalyticsProps
}

export type Safe4337Options = {
  chainId: bigint
  protocolKit: Safe
  bundlerUrl: string
  paymasterOptions?: PaymasterOptions
  bundlerClient: BundlerClient
  entryPointAddress: string
  safe4337ModuleAddress: string
  safeWebAuthnSharedSignerAddress?: string
  onchainAnalytics?: OnchainAnalyticsProps
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
  executable: EthSafeOperation | SafeOperationResponse
}

export type EstimateSponsoredGasData = (
  | {
      paymasterAndData: string
    }
  | { paymaster: string; paymasterData: string }
) &
  EstimateGasData

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
  paymasterOptions?: PaymasterOptions
}

export type EstimateFeeFunction = ({
  userOperation,
  bundlerUrl,
  entryPoint,
  paymasterOptions
}: EstimateFeeFunctionProps) => Promise<EstimateGasData>

export interface IFeeEstimator {
  setupEstimation?: EstimateFeeFunction
  adjustEstimation?: EstimateFeeFunction
  getPaymasterEstimation?: EstimateFeeFunction
}

export type EstimateFeeProps = {
  safeOperation: EthSafeOperation
  feeEstimator?: IFeeEstimator
}

type UserOperationStringValues = Omit<
  UserOperation,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
> & {
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

export type PimlicoCustomRpcSchema = [
  {
    Method: 'pimlico_getUserOperationGasPrice'
    Parameters: never
    ReturnType: {
      slow: { maxFeePerGas: string; maxPriorityFeePerGas: string }
      standard: { maxFeePerGas: string; maxPriorityFeePerGas: string }
      fast: { maxFeePerGas: string; maxPriorityFeePerGas: string }
    }
  },
  {
    Method: RPC_4337_CALLS.SPONSOR_USER_OPERATION
    Parameters: [UserOperationStringValues, string, { token?: string }?]
    ReturnType:
      | {
          paymasterAndData: string
          callGasLimit: string
          verificationGasLimit: string
          verificationGas: string
          preVerificationGas: string
        }
      | {
          paymaster: string
          paymasterData: string
          callGasLimit: string
          verificationGasLimit: string
          verificationGas: string
          preVerificationGas: string
          paymasterVerificationGasLimit: string
          paymasterPostOpGasLimit: string
        }
  },
  {
    Method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA
    Parameters: [UserOperationStringValues, string, string, { token?: string }?]
    ReturnType:
      | {
          paymasterAndData: string
        }
      | {
          paymaster: string
          paymasterData: string
          paymasterVerificationGasLimit?: string
          paymasterPostOpGasLimit?: string
        }
  },
  {
    Method: RPC_4337_CALLS.GET_PAYMASTER_DATA
    Parameters: [UserOperationStringValues, string, string, { token?: string }?]
    ReturnType:
      | {
          paymasterAndData: string
          preVerificationGas: string
          verificationGasLimit: string
          callGasLimit: string
        }
      | {
          paymaster: string
          paymasterData: string
        }
  },
  {
    Method: RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS
    Parameters: never
    ReturnType: Hex[]
  },
  {
    Method: RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS
    Parameters: [UserOperationStringValues, string]
    ReturnType: {
      callGasLimit: string
      verificationGasLimit: string
      preVerificationGas: string
      paymasterPostOpGasLimit?: string
      paymasterVerificationGasLimit?: string
    }
  },
  {
    Method: RPC_4337_CALLS.SEND_USER_OPERATION
    Parameters: [UserOperationStringValues, string]
    ReturnType: Hex
  },
  {
    Method: RPC_4337_CALLS.GET_USER_OPERATION_BY_HASH
    Parameters: [Hash]
    ReturnType: {
      userOperation: UserOperation
      entryPoint: Address
      transactionHash: Hash
      blockHash: Hash
      blockNumber: string
    }
  },
  {
    Method: RPC_4337_CALLS.GET_USER_OPERATION_RECEIPT
    Parameters: [Hash]
    ReturnType: UserOperationReceipt
  }
]

export type BundlerClient = PublicClient<
  Transport,
  Chain | undefined,
  Account | undefined,
  [...PimlicoCustomRpcSchema, ...PublicRpcSchema]
>
