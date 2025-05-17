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
import BaseSafeOperation from '@safe-global/relay-kit/packs/safe-4337/BaseSafeOperation'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'

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
  sponsorshipPolicyId?: string
}

export type ERC20PaymasterOption = {
  isSponsored?: false
  paymasterAddress: string
  paymasterTokenAddress: string
  amountToApprove?: bigint
}

export type PaymasterOptions =
  | ({ paymasterUrl: string; skipApproveTransaction?: boolean } & (
      | SponsoredPaymasterOption
      | ERC20PaymasterOption
    ))
  | undefined

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
    customNonce?: bigint
    paymasterTokenAddress?: string
  }
}

export type Safe4337ExecutableProps = {
  executable: BaseSafeOperation | SafeOperationResponse
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
  preEstimateUserOperationGas?: EstimateFeeFunction
  postEstimateUserOperationGas?: EstimateFeeFunction
  defaultVerificationGasLimitOverhead?: bigint
}

export type EstimateFeeProps = {
  safeOperation: BaseSafeOperation
  feeEstimator?: IFeeEstimator
  paymasterOptions?: PaymasterOptions
}

export type UserOperationStringValues = Omit<
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

export type Safe4337RpcSchema = [
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
  },
  {
    Method: 'pimlico_getTokenQuotes'
    Parameters: [{ tokens: string[] }, string, string]
    ReturnType: PimlicoTokenQuotesResponse
  },
  {
    Method: 'pm_supportedERC20Tokens'
    Parameters: [string]
    ReturnType: DefaultPaymasterTokensResponse
  }
]

export type RpcSchemaEntry = {
  Method: string
  Parameters: unknown[]
  ReturnType: unknown
}

export type BundlerClient<ProviderCustomRpcSchema extends RpcSchemaEntry[] = []> = PublicClient<
  Transport,
  Chain | undefined,
  Account | undefined,
  [...PublicRpcSchema, ...Safe4337RpcSchema, ...ProviderCustomRpcSchema]
>

export type PimlicoPaymasterTokenQuote = {
  paymaster: string
  token: string
  postOpGas: string
  exchangeRate: string
  exchangeRateNativeToUsd: string
  balanceSlot: string
  allowanceSlot: string
}

export type DefaultPaymasterTokenQuote = {
  address: string
  exchangeRate: string
}

export type PimlicoTokenQuotesResponse = {
  quotes: PimlicoPaymasterTokenQuote[]
}

export type DefaultPaymasterTokensResponse = {
  tokens: DefaultPaymasterTokenQuote[]
}
