import { Account, Chain, Transport, TypedDataDomain, TypedDataParameter, WalletClient } from 'viem'
import {
  SafeMultisigTransactionResponse,
  SafeTransactionData,
  UserOperation,
  SafeOperationResponse,
  ListResponse,
  SignatureType
} from '@safe-global/types-kit'

export type ListOptions = {
  /** Maximum number of results to return per page */
  limit?: number
  /** Initial index from which to return the results */
  offset?: number
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
  readonly dataDecoded?: string
}

export type GetSafeDelegateProps = {
  safeAddress?: string
  delegateAddress?: string
  delegatorAddress?: string
  label?: string
} & ListOptions

export type AddSafeDelegateProps = {
  safeAddress?: string
  delegateAddress: string
  delegatorAddress: string
  signer: WalletClient<Transport, Chain, Account>
  label: string
}

export type DeleteSafeDelegateProps = {
  delegateAddress: string
  delegatorAddress: string
  signer: WalletClient<Transport, Chain, Account>
}

export type SafeDelegateResponse = {
  readonly safe: string
  readonly delegate: string
  readonly delegator: string
  readonly label: string
  readonly expiryDate: string
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

export type ProposeTransactionProps = {
  safeAddress: string
  safeTransactionData: SafeTransactionData
  safeTxHash: string
  senderAddress: string
  senderSignature: string
  origin?: string
}

export type PendingTransactionsOptions = {
  currentNonce?: number
  hasConfirmations?: boolean
  /** Which field to use when ordering the results. It can be: `nonce`, `created`, `modified` (default: `-created`) */
  ordering?: string
} & ListOptions

export type SafeMultisigTransactionListResponse = ListResponse<SafeMultisigTransactionResponse>

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

export type SafeModuleTransactionListResponse = ListResponse<SafeModuleTransaction>

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

export type AllTransactionsOptions = {
  executed?: boolean
  queued?: boolean
  trusted?: boolean
}

export type AllTransactionsListResponse = ListResponse<
  | SafeModuleTransactionWithTransfersResponse
  | SafeMultisigTransactionWithTransfersResponse
  | EthereumTxWithTransfersResponse
>

export type ModulesResponse = {
  safes: string[]
}

export type SafeMessageConfirmation = {
  readonly created: string
  readonly modified: string
  readonly owner: string
  readonly signature: string
  readonly signatureType: SignatureType
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
  readonly origin?: string
}

export type SafeMessageListResponse = ListResponse<SafeMessage>

export type AddMessageProps = {
  message: string | EIP712TypedData
  safeAppId?: number
  signature: string
}

export type GetSafeMessageListProps = {
  /** Which field to use when ordering the results. It can be: `created`, `modified` (default: `-created`) */
  ordering?: string
} & ListOptions

export type EIP712TypedData = {
  domain: TypedDataDomain
  types: TypedDataParameter
  message: Record<string, unknown>
}

export type GetSafeOperationListProps = {
  /** Address of the Safe to get SafeOperations for */
  safeAddress: string
  /** Which field to use when ordering the results. It can be: `user_operation__nonce`, `created` (default: `-user_operation__nonce`) */
  ordering?: string
} & ListOptions

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
