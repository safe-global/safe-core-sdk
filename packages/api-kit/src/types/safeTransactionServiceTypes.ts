import { Signer, TypedDataDomain, TypedDataField } from 'ethers'
import {
  SafeMultisigTransactionResponse,
  SafeTransactionData,
  UserOperation,
  SafeOperationResponse
} from '@safe-global/safe-core-sdk-types'

export type SafeServiceInfoResponse = {
  readonly name: string
  readonly version: string
  readonly api_version: string
  readonly secure: boolean
  readonly settings: {
    readonly AWS_CONFIGURED: boolean
    readonly AWS_S3_CUSTOM_DOMAIN: string
    readonly ETHEREUM_NODE_URL: string
    readonly ETHEREUM_TRACING_NODE_URL: string
    readonly ETH_INTERNAL_TXS_BLOCK_PROCESS_LIMIT: number
    readonly ETH_INTERNAL_NO_FILTER: boolean
    readonly ETH_REORG_BLOCKS: number
    readonly TOKENS_LOGO_BASE_URI: string
    readonly TOKENS_LOGO_EXTENSION: string
  }
}

export type SafeSingletonResponse = {
  address: string
  version: string
  deployer: string
  deployedBlockNumber: number
  lastIndexedBlockNumber: number
}

export type SafeInfoResponse = {
  readonly address: string
  readonly nonce: number
  readonly threshold: number
  readonly owners: string[]
  readonly singleton: string
  readonly modules: string[]
  readonly fallbackHandler: string
  readonly guard: string
  readonly version: string
}

export type OwnerResponse = {
  safes: string[]
}

export type SafeCreationInfoResponse = {
  readonly created: string
  readonly creator: string
  readonly transactionHash: string
  readonly factoryAddress: string
  readonly singleton: string
  readonly setupData: string
  readonly dataDecoded?: string
}

export type GetSafeDelegateProps = {
  safeAddress?: string
  delegateAddress?: string
  delegatorAddress?: string
  label?: string
  limit?: string
  offset?: string
}

export type AddSafeDelegateProps = {
  safeAddress?: string
  delegateAddress: string
  delegatorAddress: string
  signer: Signer
  label: string
}

export type DeleteSafeDelegateProps = {
  delegateAddress: string
  delegatorAddress: string
  signer: Signer
}

export type SafeDelegateResponse = {
  readonly safe: string
  readonly delegate: string
  readonly delegator: string
  readonly label: string
  readonly signature: string
}

export type SafeDelegateListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: {
    readonly safe: string
    readonly delegate: string
    readonly delegator: string
    readonly label: string
  }[]
}

export type SafeMultisigTransactionEstimate = {
  readonly to: string
  readonly value: string
  readonly data?: string
  readonly operation: number
}

export type SafeMultisigTransactionEstimateResponse = {
  readonly safeTxGas: string
}

export type SignatureResponse = {
  readonly signature: string
}

export type ProposeTransactionProps = {
  safeAddress: string
  safeTransactionData: SafeTransactionData
  safeTxHash: string
  senderAddress: string
  senderSignature: string
  origin?: string
}

export type SafeMultisigTransactionListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: SafeMultisigTransactionResponse[]
}

export type TransferResponse = {
  readonly type?: string
  readonly executionDate: string
  readonly blockNumber: number
  readonly transactionHash: string
  readonly to: string
  readonly value: string
  readonly tokenId: string
  readonly tokenAddress?: string
  readonly from: string
}

export type TransferListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: TransferResponse[]
}

export type SafeModuleTransaction = {
  readonly created?: string
  readonly executionDate: string
  readonly blockNumber?: number
  readonly isSuccessful?: boolean
  readonly transactionHash?: string
  readonly safe: string
  readonly module: string
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation: number
  readonly dataDecoded?: string
}

export type SafeModuleTransactionListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: SafeModuleTransaction[]
}

export type Erc20Info = {
  readonly name: string
  readonly symbol: string
  readonly decimals: number
  readonly logoUri: string
}

export type TokenInfoResponse = {
  readonly type?: string
  readonly address: string
  readonly name: string
  readonly symbol: string
  readonly decimals: number
  readonly logoUri?: string
}

export type TokenInfoListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: TokenInfoResponse[]
}

export type TransferWithTokenInfoResponse = TransferResponse & {
  readonly tokenInfo: TokenInfoResponse
}

export type SafeModuleTransactionWithTransfersResponse = SafeModuleTransaction & {
  readonly txType?: 'MODULE_TRANSACTION'
  readonly transfers: TransferWithTokenInfoResponse[]
}

export type SafeMultisigTransactionWithTransfersResponse = SafeMultisigTransactionResponse & {
  readonly txType?: 'MULTISIG_TRANSACTION'
  readonly transfers: TransferWithTokenInfoResponse[]
}

export type EthereumTxResponse = {
  readonly executionDate: string
  readonly to: string
  readonly data: string
  readonly txHash: string
  readonly blockNumber?: number
  readonly from: string
}

export type EthereumTxWithTransfersResponse = EthereumTxResponse & {
  readonly txType?: 'ETHEREUM_TRANSACTION'
  readonly transfers: TransferWithTokenInfoResponse[]
}

export type AllTransactionsOptions = {
  executed?: boolean
  queued?: boolean
  trusted?: boolean
}

export type AllTransactionsListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: Array<
    | SafeModuleTransactionWithTransfersResponse
    | SafeMultisigTransactionWithTransfersResponse
    | EthereumTxWithTransfersResponse
  >
}

export type ModulesResponse = {
  safes: string[]
}

export type SafeMessageConfirmation = {
  readonly created: string
  readonly modified: string
  readonly owner: string
  readonly signature: string
  readonly signatureType: string
}

export type SafeMessage = {
  readonly created: string
  readonly modified: string
  readonly safe: string
  readonly messageHash: string
  readonly message: string | EIP712TypedData
  readonly proposedBy: string
  readonly safeAppId: null | string
  readonly confirmations: Array<SafeMessageConfirmation>
  readonly preparedSignature: string
}

export type SafeMessageListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: SafeMessage[]
}

export type AddMessageProps = {
  message: string | EIP712TypedData
  safeAppId?: number
  signature: string
}

export type GetSafeMessageListProps = {
  ordering?: string
  limit?: string
  offset?: string
}

export type EIP712TypedData = {
  domain: TypedDataDomain
  types: TypedDataField
  message: Record<string, unknown>
}

export type GetSafeOperationListProps = {
  /** Address of the Safe to get SafeOperations for */
  safeAddress: string
  /** Which field to use when ordering the results */
  ordering?: string
  /** Maximum number of results to return per page */
  limit?: string
  /** Initial index from which to return the results */
  offset?: string
}

export type GetSafeOperationListResponse = {
  readonly count: number
  readonly next?: string
  readonly previous?: string
  readonly results: Array<SafeOperationResponse>
}

export type AddSafeOperationProps = {
  /** Address of the EntryPoint contract */
  entryPoint: string
  /** Address of the Safe4337Module contract */
  moduleAddress: string
  /** Address of the Safe to add a SafeOperation for */
  safeAddress: string
  /** UserOperation object to add */
  userOperation: UserOperation
  /** Options object */
  options?: {
    /** The UserOperation will remain valid until this block's timestamp */
    validUntil?: number
    /** The UserOperation will be valid after this block's timestamp */
    validAfter?: number
  }
}
