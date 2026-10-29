import {
  UserOperation,
  SafeOperationResponse,
  DataDecoded,
  SignatureType,
  UserOperationResponse
} from '@safe-global/types-kit'
import { ListOptions, ListResponse } from './common'

export type QueryParamsOptions = {
  // Accept query params that are part of the swagger documentation. Check at https://safe-transaction-mainnet.safe.global/
  [key: string]: string | number | boolean | undefined
}

export type IndexerServiceInfoResponse = {
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
  l2: boolean
}

export type SafeInfoResponse = {
  readonly address: string
  readonly nonce: string
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
  readonly saltNonce: string | null
  readonly dataDecoded?: DataDecoded
  readonly userOperation: UserOperationResponse | null
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

export type GetIncomingTransactionsOptions = {
  from?: string
} & ListOptions &
  // Other query parameters may be accepted. Check at https://safe-transaction-mainnet.safe.global/#/transactions/safes_incoming_transfers_list
  QueryParamsOptions

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
  readonly data: string | null
  readonly operation: number
  readonly dataDecoded?: DataDecoded
}

export type SafeModuleTransactionListResponse = ListResponse<SafeModuleTransaction>

export type GetModuleTransactionsOptions = {
  module?: string
} & ListOptions &
  // Other query parameters may be accepted. Check at https://safe-transaction-mainnet.safe.global/#/transactions/safes_module_transactions_list
  QueryParamsOptions

export type TransferResponse = {
  readonly type: string
  readonly executionDate: string
  readonly blockNumber: number
  readonly transactionHash: string
  readonly to: string
  readonly value?: string
  readonly tokenId?: string
  readonly tokenAddress?: string
  readonly transferId: string
  readonly tokenInfo?: TokenInfoResponse
  readonly from: string
}

export type TransferListResponse = ListResponse<TransferResponse>

export type TokenInfoResponse = {
  readonly type: string
  readonly address: string
  readonly name: string
  readonly symbol: string
  readonly decimals?: number
  readonly logoUri?: string
  readonly trusted: boolean
}

export type TokenInfoListResponse = ListResponse<TokenInfoResponse>

export type TokenInfoListOptions = {
  /** Search term that will match `name` or `symbol` */
  search?: string
  address?: string
  /** Which field to use when ordering the results. It can be: `name`, `symbol`, `address` (default: `-name`) */
  ordering?: string
} & ListOptions &
  // Other query parameters may be accepted. Check at https://safe-transaction-mainnet.safe.global/#/tokens/tokens_list
  QueryParamsOptions

export type SafeModuleTransactionWithTransfersResponse = SafeModuleTransaction & {
  readonly txType?: 'MODULE_TRANSACTION'
  readonly transfers: TransferResponse[]
}

/** Confirmation of a multisig transaction as indexed by the Safe Transaction Service */
export type IndexerMultisigConfirmationResponse = {
  readonly owner: string
  readonly submissionDate: string
  readonly transactionHash?: string
  readonly confirmationType?: string
  readonly signature: string
  readonly signatureType: SignatureType
}

/** Multisig transaction as indexed by the Safe Transaction Service, with its execution data */
export type IndexerMultisigTransactionResponse = {
  readonly safe: string
  readonly to: string
  readonly value: string
  readonly data?: string
  readonly operation: number
  readonly gasToken: string
  readonly safeTxGas: string
  readonly baseGas: string
  readonly gasPrice: string
  readonly refundReceiver?: string
  readonly nonce: string
  readonly executionDate: string | null
  readonly submissionDate: string
  readonly modified: string
  readonly blockNumber: number | null
  readonly transactionHash: string | null
  readonly safeTxHash: string
  readonly executor: string | null
  readonly proposer: string | null
  readonly proposedByDelegate: string | null
  readonly isExecuted: boolean
  readonly isSuccessful: boolean | null
  readonly ethGasPrice: string | null
  readonly maxFeePerGas: string | null
  readonly maxPriorityFeePerGas: string | null
  readonly gasUsed: number | null
  readonly fee: string | null
  readonly origin: string
  readonly dataDecoded?: DataDecoded
  readonly confirmationsRequired: number
  readonly confirmations?: IndexerMultisigConfirmationResponse[]
  readonly trusted: boolean
  readonly signatures: string | null
}

export type SafeMultisigTransactionWithTransfersResponse = IndexerMultisigTransactionResponse & {
  readonly txType?: 'MULTISIG_TRANSACTION'
  readonly transfers: TransferResponse[]
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
  readonly transfers: TransferResponse[]
}

export type AllTransactionsOptions = ListOptions

export type AllTransactionsListResponse = ListResponse<
  | SafeModuleTransactionWithTransfersResponse
  | SafeMultisigTransactionWithTransfersResponse
  | EthereumTxWithTransfersResponse
>

export type ModulesResponse = {
  safes: string[]
}

export type GetSafeOperationListOptions = {
  hasConfirmations?: boolean
  executed?: boolean
  /** Which field to use when ordering the results. It can be: `user_operation__nonce`, `created` (default: `-user_operation__nonce`) */
  ordering?: string
} & ListOptions &
  // Other query parameters may be accepted. Check at https://safe-transaction-mainnet.safe.global/#/4337/safes_safe_operations_list
  QueryParamsOptions

export type GetPendingSafeOperationListOptions = {
  hasConfirmations?: boolean
  /** Which field to use when ordering the results. It can be: `user_operation__nonce`, `created` (default: `-user_operation__nonce`) */
  ordering?: string
} & ListOptions &
  // Other query parameters may be accepted. Check at https://safe-transaction-mainnet.safe.global/#/4337/safes_safe_operations_list
  QueryParamsOptions

export type GetSafeOperationListResponse = ListResponse<SafeOperationResponse>

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
