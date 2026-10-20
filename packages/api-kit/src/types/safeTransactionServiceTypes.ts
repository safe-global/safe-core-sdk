import { Account, Chain, Transport, WalletClient } from 'viem'
import {
  EIP712TypedData,
  ProposalRoute,
  SafeMultisigConfirmationResponse,
  SafeMultisigTransactionResponse,
  SafeTransactionData,
  UserOperation,
  SafeOperationResponse,
  ListResponse,
  SignatureType,
  DataDecoded,
  UserOperationResponse
} from '@safe-global/types-kit'

export type ListOptions = {
  /** Maximum number of results to return per page */
  limit?: number
  /** Initial index from which to return the results */
  offset?: number
}

export type QueryParamsOptions = {
  // Accept query params that are part of the swagger documentation. Check at https://safe-transaction-mainnet.safe.global/
  [key: string]: string | number | boolean | undefined
}

/** Sort direction of the `nonce` field in the transaction lists of the Safe Queue Service */
export type NonceOrder = 'asc' | 'desc'

/** Accuracy of the decoding returned by the Safe Decoder Service */
export type DecodingAccuracy = 'FULL_MATCH' | 'PARTIAL_MATCH' | 'ONLY_FUNCTION_MATCH' | 'NO_MATCH'

export type DecodeDataResponse = DataDecoded & {
  readonly accuracy: DecodingAccuracy
}

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

export type GetSafeDelegateProps = {
  safeAddress?: string
  delegateAddress?: string
  delegatorAddress?: string
  /** Exact match, case-sensitive */
  label?: string
} & ListOptions

export type AddSafeDelegateProps = {
  /** Safe the delegation is scoped to. When omitted the delegate is valid for all the Safes of the delegator on this chain */
  safeAddress?: string
  delegateAddress: string
  delegatorAddress: string
  signer: WalletClient<Transport, Chain, Account>
  label: string
}

export type UpdateSafeDelegateProps = AddSafeDelegateProps

export type DeleteSafeDelegateProps = {
  /** Safe the delegation is scoped to. Must match the scope used when the delegate was added */
  safeAddress?: string
  delegateAddress: string
  delegatorAddress: string
  signer: WalletClient<Transport, Chain, Account>
}

export type SafeDelegateResponse = {
  readonly created: string
  readonly modified: string
  readonly delegate: string
  readonly delegator: string
  /** Chain the delegation is valid on. `null` means all chains */
  readonly chainId: string | null
  /** Safe the delegation is scoped to. `null` means all the Safes of the delegator */
  readonly safe: string | null
  readonly label: string | null
}

export type SignedSafeDelegateResponse = SafeDelegateResponse & {
  readonly signature: string
}

export type SafeDelegateListResponse = ListResponse<SafeDelegateResponse>

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

export type SafeMultisigConfirmationCreationResponse = SafeMultisigConfirmationResponse & {
  readonly safeTxHash: string
}

export type SafeMultisigConfirmationListResponse = ListResponse<SafeMultisigConfirmationResponse>

export type ProposeTransactionProps = {
  safeAddress: string
  safeTransactionData: SafeTransactionData
  /**
   * Hash of the Safe transaction. The Safe Queue Service calculates it, so it is optional.
   * When provided it is checked against the hash calculated by the service.
   */
  safeTxHash?: string
  /** @deprecated The Safe Queue Service derives the proposer from the signature. Kept for backwards compatibility, it is not sent */
  senderAddress?: string
  /**
   * Safe-encoded signature of the proposer. It can come from a Safe owner, an authorized delegate
   * or an owner of a Safe that owns this Safe. Several owner signatures can be packed together.
   */
  senderSignature: string
  /**
   * Information about the app proposing the transaction. A JSON string with `name` and `url`
   * is split into `originName` and `originUrl`, any other string is used as `originName`.
   * Prefer `originName` and `originUrl`.
   */
  origin?: string
  /** Name of the dapp or client submitting the transaction (max 100 characters) */
  originName?: string
  /** URL of the dapp or client submitting the transaction (max 200 characters) */
  originUrl?: string
  notes?: string
  /**
   * Transaction on the Safe at `to`, proposed together with this one. Used when an owner Safe
   * approves (`approveHash`) or executes (`execTransaction`) a transaction of a Safe it owns.
   */
  nestedTransaction?: SafeTransactionData
}

export type DeleteTransactionProps = {
  safeTxHash: string
  /** The EOA that proposed the transaction (proposer, delegate or nested Safe owner) */
  signer: WalletClient<Transport, Chain, Account>
}

export type GetMultisigTransactionsOptions = {
  /** `true` returns only executed transactions, `false` only the not executed ones. All of them when omitted */
  executed?: boolean
  /** Nonce sort direction (default: `desc`) */
  nonceOrder?: NonceOrder
} & ListOptions

export type PendingTransactionsOptions = {
  /** Nonce sort direction (default: `asc`) */
  nonceOrder?: NonceOrder
} & ListOptions

export type SafeMultisigTransactionListResponse = ListResponse<SafeMultisigTransactionResponse>

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

export type SafeMultisigTransactionWithTransfersResponse = SafeMultisigTransactionResponse & {
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

export type SafeMessageConfirmation = {
  readonly owner: string
  readonly signature: string
  readonly signatureType: SignatureType
  readonly created: string
  readonly modified: string
}

export type SafeMessage = {
  readonly messageHash: string
  readonly chainId: string
  readonly safe: string
  readonly message: string | EIP712TypedData
  /** Address credited with the proposal: the signer for `OWNER`, the owner Safe for `NESTED_OWNER` */
  readonly proposer: string
  readonly proposedVia: ProposalRoute
  /** Address that actually signed the proposal, set only when it differs from `proposer` (`NESTED_OWNER`) */
  readonly proposedBy: string | null
  readonly confirmations: SafeMessageConfirmation[]
  readonly preparedSignature: string | null
  /** Single EIP-1271 signature ready to be consumed wherever a signature owned by this Safe is expected */
  readonly preparedSignatureEip1271: string | null
  readonly originName: string | null
  readonly originUrl: string | null
  readonly created: string
  readonly modified: string
}

export type SafeMessageListResponse = ListResponse<SafeMessage>

export type AddMessageOptions = {
  message: string | EIP712TypedData
  /** Safe-encoded signature of the message. Several owner signatures can be packed together */
  signature: string
  /** Name of the dapp or client submitting the message (max 100 characters) */
  originName?: string
  /** URL of the dapp or client submitting the message (max 200 characters) */
  originUrl?: string
}

export type GetSafeMessageListOptions = ListOptions

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
