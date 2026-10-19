import { Account, Chain, Transport, WalletClient } from 'viem'
import {
  EIP712TypedData,
  ListResponse,
  ProposalRoute,
  SafeMultisigConfirmationResponse,
  SafeMultisigTransactionResponse,
  SafeTransactionData,
  SignatureType
} from '@safe-global/types-kit'

export type ListOptions = {
  /** Maximum number of results to return per page */
  limit?: number
  /** Initial index from which to return the results */
  offset?: number
}

/** Sort direction of the `nonce` field in transaction lists */
export type NonceOrder = 'asc' | 'desc'

export type SafeServiceInfoResponse = {
  readonly version: string
  readonly buildCommit: string | null
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

export type SafeDelegateListResponse = ListResponse<SafeDelegateResponse>

export type SafeMultisigConfirmationCreationResponse = SafeMultisigConfirmationResponse & {
  readonly safeTxHash: string
}

export type ProposeTransactionProps = {
  safeAddress: string
  safeTransactionData: SafeTransactionData
  /**
   * Safe-encoded signature of the proposer. It can come from a Safe owner, an authorized delegate
   * or an owner of a Safe that owns this Safe. Several owner signatures can be packed together.
   */
  senderSignature: string
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
