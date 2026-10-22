import { zeroAddress } from 'viem'
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit'
import { HttpMethod } from '@safe-global/api-kit/utils/httpRequests'
import { DelegateAction, signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import {
  AddDelegateProps,
  AddMessageProps,
  ConfirmationCreationResponse,
  DelegateListResponse,
  DelegateResponse,
  DeleteTransactionProps,
  GetDelegatesOptions,
  GetMessagesOptions,
  GetPendingTransactionsOptions,
  GetSafeTransactionsOptions,
  GetTransactionsOptions,
  MessageConfirmation,
  MessageListResponse,
  MessageResponse,
  ProposeTransactionProps,
  QueueServiceInfoResponse,
  RemoveDelegateProps,
  SafeFilter,
  Signatures,
  TransactionListResponse,
  UpdateDelegateProps
} from '@safe-global/api-kit/types/queueServiceTypes'
import { BaseClient } from './BaseClient'

const toArray = (signatures: Signatures): string[] =>
  Array.isArray(signatures) ? signatures : [signatures]

/**
 * Client of the Safe Queue Service: the off-chain queue of multisig transactions, messages and delegates.
 * One method per endpoint of the service.
 */
export class QueueClient extends BaseClient {
  /**
   * Returns the version of the service.
   *
   * @returns The version and build of the service
   */
  async getServiceInfo(): Promise<QueueServiceInfoResponse> {
    return this.api({
      url: `${this.baseUrl}/about`,
      method: HttpMethod.Get
    })
  }

  // Delegates

  /**
   * Returns the list of delegates. At least one of `safeAddress`, `delegateAddress` or `delegatorAddress` is required.
   * Without `chainId` the list includes the delegations of every chain; check the `chainId` of each result, `null` means all chains.
   *
   * @param options - Filters and pagination
   * @returns The list of delegates
   * @throws "At least one of safeAddress, delegateAddress or delegatorAddress is required"
   */
  async getDelegates({
    safeAddress,
    delegateAddress,
    delegatorAddress,
    chainId,
    label,
    limit,
    offset
  }: GetDelegatesOptions): Promise<DelegateListResponse> {
    if (!safeAddress && !delegateAddress && !delegatorAddress) {
      throw new Error(
        'At least one of safeAddress, delegateAddress or delegatorAddress is required'
      )
    }

    const url = new URL(`${this.baseUrl}/delegates`)

    this.addQueryParams(url, {
      chainId,
      safe: safeAddress ? this.getAddress(safeAddress) : undefined,
      delegate: delegateAddress ? this.getAddress(delegateAddress) : undefined,
      delegator: delegatorAddress ? this.getAddress(delegatorAddress) : undefined,
      label,
      limit,
      offset
    })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  async #sendDelegateRequest<T>(
    method: HttpMethod,
    action: DelegateAction,
    {
      safeAddress,
      delegateAddress,
      delegatorAddress,
      signer,
      label,
      allChains
    }: RemoveDelegateProps & { label?: string }
  ): Promise<T> {
    if (delegateAddress === '') {
      throw new Error('Invalid Safe delegate address')
    }
    if (delegatorAddress === '') {
      throw new Error('Invalid Safe delegator address')
    }
    if (label === '') {
      throw new Error('Invalid label')
    }
    const safe = safeAddress ? this.getAddress(safeAddress) : null
    const delegate =
      delegateAddress === zeroAddress ? zeroAddress : this.getAddress(delegateAddress)
    const delegator = this.getAddress(delegatorAddress)
    const chainId = allChains ? null : this.chainId
    const signature = await signDelegate(signer, delegate, chainId ?? 0n, action, safe ?? undefined)

    const body: Record<string, unknown> = {
      chainId: chainId === null ? null : Number(chainId),
      safe,
      delegate,
      delegator,
      signature
    }
    if (label !== undefined) {
      body.label = label
    }

    return this.api({
      url: `${this.baseUrl}/delegates`,
      method,
      body
    })
  }

  /**
   * Authorizes a delegate to propose transactions on behalf of the delegator (a Safe owner).
   * The delegation is scoped to the chain of the kit (or all chains with `allChains`) and to the optional Safe.
   *
   * @param props - The configuration of the new delegate
   * @returns The created delegate
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   */
  async addDelegate(props: AddDelegateProps): Promise<DelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Post, 'add', props)
  }

  /**
   * Updates the label of an existing delegate. The scope must match the one used when the delegate was added.
   *
   * @param props - The configuration of the delegate with the new label
   * @returns The updated delegate
   * @throws "No matching delegates found"
   */
  async updateDelegate(props: UpdateDelegateProps): Promise<DelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Patch, 'edit', props)
  }

  /**
   * Revokes a delegate. The scope must match the one used when the delegate was added.
   * Use the zero address as delegate to revoke every delegate of the delegator in the scope.
   *
   * @param props - The configuration of the delegate to revoke
   * @throws "No matching delegates found"
   */
  async removeDelegate(props: RemoveDelegateProps): Promise<void> {
    return this.#sendDelegateRequest(HttpMethod.Delete, 'delete', props)
  }

  // Multisig transactions

  /**
   * Proposes a multisig transaction. The first signature determines the proposer: a Safe owner,
   * an authorized delegate or an owner of a Safe that owns this Safe.
   *
   * @param props - The transaction, its signatures and the optional metadata
   * @returns The stored transaction, including its `safeTxHash`
   * @throws "Invalid Safe address"
   * @throws "Invalid signatures"
   */
  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    signatures,
    originName,
    originUrl,
    notes,
    nestedTransaction
  }: ProposeTransactionProps): Promise<SafeMultisigTransactionResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const signatureList = toArray(signatures).filter(Boolean)
    if (signatureList.length === 0) {
      throw new Error('Invalid signatures')
    }

    return this.api({
      url: `${this.baseUrl}/multisig-transactions`,
      method: HttpMethod.Post,
      body: {
        ...safeTransactionData,
        chainId: Number(this.chainId),
        safe: this.getAddress(safeAddress),
        signatures: signatureList,
        originName,
        originUrl,
        notes,
        nestedTransaction
      }
    })
  }

  #toSafesParam(safes: SafeFilter[]): string[] {
    return safes.map((safe) =>
      typeof safe === 'string'
        ? this.getAddress(safe)
        : [this.getAddress(safe.address), ...safe.chainIds.map(String)].join(':')
    )
  }

  /**
   * Lists the multisig transactions of one or several Safes, merged in one paginated list.
   *
   * @param options - The Safes to list, filters and pagination
   * @returns The list of transactions
   * @throws "At least one Safe is required"
   */
  async getTransactions({
    safes,
    executed,
    nonceOrder,
    limit,
    offset
  }: GetTransactionsOptions): Promise<TransactionListResponse> {
    if (!safes?.length) {
      throw new Error('At least one Safe is required')
    }
    const url = new URL(`${this.baseUrl}/multisig-transactions`)
    this.#toSafesParam(safes).forEach((safe) => url.searchParams.append('safes', safe))
    this.addQueryParams(url, { executed, nonceOrder, limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Lists the pending multisig transactions of one or several Safes on the chain of the kit:
   * the ones not executed whose nonce is equal or higher than the current nonce of the Safe.
   *
   * @param safeAddresses - One or several Safe addresses
   * @param options - Sort and pagination
   * @returns The list of pending transactions
   * @throws "Invalid Safe address"
   */
  async getPendingTransactions(
    safeAddresses: string | string[],
    { nonceOrder, limit, offset }: GetPendingTransactionsOptions = {}
  ): Promise<TransactionListResponse> {
    const addresses = Array.isArray(safeAddresses) ? safeAddresses : [safeAddresses]
    if (addresses.length === 0 || addresses.some((address) => address === '')) {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(`${this.baseUrl}/multisig-transactions/queue`)
    addresses.forEach((address) =>
      url.searchParams.append('safes', `${this.getAddress(address)}:${this.chainId}`)
    )
    this.addQueryParams(url, { nonceOrder, limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns several multisig transactions by their Safe transaction hashes, in no particular order.
   * Unknown hashes are left out.
   *
   * @param safeTxHashes - Up to 100 Safe transaction hashes
   * @returns The transactions found
   * @throws "At least one safeTxHash is required"
   */
  async getTransactionsBatch(safeTxHashes: string[]): Promise<SafeMultisigTransactionResponse[]> {
    if (!safeTxHashes?.length) {
      throw new Error('At least one safeTxHash is required')
    }
    const url = new URL(`${this.baseUrl}/multisig-transactions/batch`)
    safeTxHashes.forEach((safeTxHash) => url.searchParams.append('safeTxHash', safeTxHash))

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a multisig transaction with its confirmations.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @returns The transaction
   * @throws "Invalid safeTxHash"
   */
  async getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return this.api({
      url: `${this.baseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Deletes a pending multisig transaction. Only the EOA that proposed it (proposer, delegate or nested Safe owner) can delete it.
   *
   * @param props - The hash of the transaction, its Safe and the signer that proposed it
   * @throws "Invalid safeTxHash"
   * @throws "Invalid Safe address"
   */
  async deleteTransaction({
    safeTxHash,
    safeAddress,
    signer
  }: DeleteTransactionProps): Promise<void> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const safe = this.getAddress(safeAddress)
    const signature = await signDeleteTransaction(signer, safeTxHash, safe, this.chainId)

    return this.api({
      url: `${this.baseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Delete,
      body: { signature }
    })
  }

  /**
   * Lists the multisig transactions of a Safe on the chain of the kit (or on every chain with `allChains`).
   *
   * @param safeAddress - The Safe address
   * @param options - Filters and pagination
   * @returns The list of transactions
   * @throws "Invalid Safe address"
   */
  async getSafeTransactions(
    safeAddress: string,
    { executed, nonceOrder, allChains, limit, offset }: GetSafeTransactionsOptions = {}
  ): Promise<TransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.baseUrl}/safes/${this.getAddress(safeAddress)}/multisig-transactions`
    )
    this.addQueryParams(url, {
      chainId: allChains ? undefined : this.chainId,
      executed,
      nonceOrder,
      limit,
      offset
    })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Adds owner confirmations to a multisig transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @param signatures - Safe-encoded signature(s) of the owners. Owner signatures can be packed together
   * @returns The confirmations added by this request
   * @throws "Invalid safeTxHash"
   * @throws "Invalid signatures"
   */
  async confirmTransaction(
    safeTxHash: string,
    signatures: Signatures
  ): Promise<ConfirmationCreationResponse[]> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    const signatureList = toArray(signatures).filter(Boolean)
    if (signatureList.length === 0) {
      throw new Error('Invalid signatures')
    }
    return this.api({
      url: `${this.baseUrl}/multisig-transactions/${safeTxHash}/signatures`,
      method: HttpMethod.Post,
      body: { signatures: signatureList }
    })
  }

  // Messages

  /**
   * Proposes an off-chain message for a Safe on the chain of the kit.
   *
   * @param safeAddress - The Safe address
   * @param props - The message, its signatures and the optional origin
   * @returns The stored message
   * @throws "Invalid Safe address"
   * @throws "Invalid signatures"
   */
  async addMessage(
    safeAddress: string,
    { message, signatures, originName, originUrl }: AddMessageProps
  ): Promise<MessageResponse> {
    if (!this.isValidAddress(safeAddress)) {
      throw new Error('Invalid Safe address')
    }
    const signatureList = toArray(signatures).filter(Boolean)
    if (signatureList.length === 0) {
      throw new Error('Invalid signatures')
    }

    return this.api({
      url: `${this.baseUrl}/safes/${safeAddress}/messages`,
      method: HttpMethod.Post,
      body: {
        chainId: Number(this.chainId),
        message,
        signatures: signatureList,
        originName,
        originUrl
      }
    })
  }

  /**
   * Lists the messages of a Safe, newest first, on the chain of the kit (or on every chain with `allChains`).
   *
   * @param safeAddress - The Safe address
   * @param options - Pagination
   * @returns The list of messages
   * @throws "Invalid Safe address"
   */
  async getMessages(
    safeAddress: string,
    { allChains, limit, offset }: GetMessagesOptions = {}
  ): Promise<MessageListResponse> {
    if (!this.isValidAddress(safeAddress)) {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(`${this.baseUrl}/safes/${safeAddress}/messages`)
    this.addQueryParams(url, { chainId: allChains ? undefined : this.chainId, limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a message with its confirmations.
   *
   * @param messageHash - The Safe message hash
   * @returns The message
   * @throws "Invalid messageHash"
   */
  async getMessage(messageHash: string): Promise<MessageResponse> {
    if (!messageHash) {
      throw new Error('Invalid messageHash')
    }
    return this.api({
      url: `${this.baseUrl}/messages/${messageHash}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds owner confirmations to a message.
   *
   * @param messageHash - The Safe message hash
   * @param signatures - Safe-encoded signature(s) of the owners
   * @returns The confirmations added by this request
   * @throws "Invalid messageHash"
   * @throws "Invalid signatures"
   */
  async confirmMessage(
    messageHash: string,
    signatures: Signatures
  ): Promise<MessageConfirmation[]> {
    if (!messageHash) {
      throw new Error('Invalid messageHash')
    }
    const signatureList = toArray(signatures).filter(Boolean)
    if (signatureList.length === 0) {
      throw new Error('Invalid signatures')
    }
    return this.api({
      url: `${this.baseUrl}/messages/${messageHash}/signatures`,
      method: HttpMethod.Post,
      body: { signatures: signatureList }
    })
  }
}
