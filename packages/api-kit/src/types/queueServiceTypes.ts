import { Account, Chain, Transport, WalletClient } from 'viem'
import {
  EIP712TypedData,
  ProposalRoute,
  SafeMultisigConfirmationResponse,
  SafeMultisigTransactionResponse,
  SafeTransactionData,
  SignatureType
} from '@safe-global/types-kit'
import { ListOptions, ListResponse } from './common'

export type QueueServiceInfoResponse = {
  readonly version: string
  readonly buildCommit: string | null
}

/** Sort direction of the `nonce` field in the transaction lists */
export type NonceOrder = 'asc' | 'desc'

/** One or several Safe-encoded signatures. Each entry can pack several owner signatures */
export type Signatures = string | string[]

export type Signer = WalletClient<Transport, Chain, Account>

// Delegates

export type GetDelegatesOptions = {
  safeAddress?: string
  delegateAddress?: string
  delegatorAddress?: string
  /** Only the delegations valid on this chain. Delegations valid on all chains are not returned when it is set */
  chainId?: bigint
  /** Exact match, case-sensitive */
  label?: string
} & ListOptions

export type AddDelegateProps = {
  /** Safe the delegation is scoped to. When omitted the delegate is valid for all the Safes of the delegator */
  safeAddress?: string
  delegateAddress: string
  delegatorAddress: string
  /** The delegator wallet, used to sign the request */
  signer: Signer
  label: string
  /** When true the delegation is valid on all chains instead of only on the chain of the kit */
  allChains?: boolean
}

export type UpdateDelegateProps = AddDelegateProps

export type RemoveDelegateProps = {
  /** Safe the delegation is scoped to. Must match the scope used when the delegate was added */
  safeAddress?: string
  /** Delegate to revoke. The zero address revokes every delegate of the delegator in the scope */
  delegateAddress: string
  delegatorAddress: string
  signer: Signer
  /** Must match the scope used when the delegate was added */
  allChains?: boolean
}

export type DelegateResponse = {
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

export type DelegateListResponse = ListResponse<DelegateResponse>

// Multisig transactions

export type ProposeTransactionProps = {
  safeAddress: string
  safeTransactionData: SafeTransactionData
  /**
   * Safe-encoded signature(s) of the proposer. The first one determines the proposer: a Safe owner,
   * an authorized delegate or an owner of a Safe that owns this Safe. Owner signatures can be packed together.
   */
  signatures: Signatures
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
  /** The Safe of the transaction, used in the domain of the signature */
  safeAddress: string
  /** The EOA that proposed the transaction (proposer, delegate or nested Safe owner) */
  signer: Signer
}

/** A Safe address, optionally restricted to some chains. Without chains, every chain of the Safe is returned */
export type SafeFilter = string | { address: string; chainIds: bigint[] }

export type GetTransactionsOptions = {
  /** Safes to list, with optional chain restriction */
  safes: SafeFilter[]
  /** `true` returns only executed transactions, `false` only the not executed ones. All of them when omitted */
  executed?: boolean
  /** Nonce sort direction (default: `desc`) */
  nonceOrder?: NonceOrder
} & ListOptions

export type GetSafeTransactionsOptions = {
  /** `true` returns only executed transactions, `false` only the not executed ones. All of them when omitted */
  executed?: boolean
  /** Nonce sort direction (default: `desc`) */
  nonceOrder?: NonceOrder
  /** Return the transactions of every chain instead of only the chain of the kit */
  allChains?: boolean
} & ListOptions

export type GetPendingTransactionsOptions = {
  /** Nonce sort direction (default: `asc`) */
  nonceOrder?: NonceOrder
} & ListOptions

export type TransactionListResponse = ListResponse<SafeMultisigTransactionResponse>

export type ConfirmationCreationResponse = SafeMultisigConfirmationResponse & {
  readonly safeTxHash: string
}

// Messages

export type MessageConfirmation = {
  readonly owner: string
  readonly signature: string
  readonly signatureType: SignatureType
  readonly created: string
  readonly modified: string
}

export type MessageResponse = {
  readonly messageHash: string
  readonly chainId: string
  readonly safe: string
  readonly message: string | EIP712TypedData
  /** Address credited with the proposal: the signer for `OWNER`, the owner Safe for `NESTED_OWNER` */
  readonly proposer: string
  readonly proposedVia: ProposalRoute
  /** Address that actually signed the proposal, set only when it differs from `proposer` (`NESTED_OWNER`) */
  readonly proposedBy: string | null
  readonly confirmations: MessageConfirmation[]
  readonly preparedSignature: string | null
  /** Single EIP-1271 signature ready to be consumed wherever a signature owned by this Safe is expected */
  readonly preparedSignatureEip1271: string | null
  readonly originName: string | null
  readonly originUrl: string | null
  readonly created: string
  readonly modified: string
}

export type MessageListResponse = ListResponse<MessageResponse>

export type AddMessageProps = {
  message: string | EIP712TypedData
  /** Safe-encoded signature(s) of the message. Owner signatures can be packed together */
  signatures: Signatures
  /** Name of the dapp or client submitting the message (max 100 characters) */
  originName?: string
  /** URL of the dapp or client submitting the message (max 200 characters) */
  originUrl?: string
}

export type GetMessagesOptions = {
  /** Return the messages of every chain instead of only the chain of the kit */
  allChains?: boolean
} & ListOptions
