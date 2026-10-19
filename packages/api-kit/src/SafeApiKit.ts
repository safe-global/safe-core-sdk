import {
  AddMessageOptions,
  AddSafeDelegateProps,
  DeleteSafeDelegateProps,
  DeleteTransactionProps,
  GetMultisigTransactionsOptions,
  GetSafeDelegateProps,
  GetSafeMessageListOptions,
  PendingTransactionsOptions,
  ProposeTransactionProps,
  SafeDelegateListResponse,
  SafeDelegateResponse,
  SafeMessage,
  SafeMessageConfirmation,
  SafeMessageListResponse,
  SafeMultisigConfirmationCreationResponse,
  SafeMultisigTransactionListResponse,
  SafeServiceInfoResponse,
  UpdateSafeDelegateProps
} from '@safe-global/api-kit/types/safeQueueServiceTypes'
import { HttpMethod, HttpRequest, sendRequest } from '@safe-global/api-kit/utils/httpRequests'
import { DelegateAction, signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
import { Eip3770Address, SafeMultisigTransactionResponse } from '@safe-global/types-kit'
import { DEFAULT_QUEUE_SERVICE_URL } from './utils/config'

export interface SafeApiKitConfig {
  /** chainId - The chainId */
  chainId: bigint
  /** queueServiceUrl - Safe Queue Service URL. Defaults to the Safe hosted service */
  queueServiceUrl?: string
  /**
   * apiKey - The API key to access the Safe Queue Service.
   * - Required if queueServiceUrl is undefined
   * - Required if queueServiceUrl contains "safe.global" or "5afe.dev"
   * - Optional otherwise
   */
  apiKey?: string
}

type QueryParams = Record<string, string | number | boolean | bigint | undefined>

const trimTrailingSlashes = (url: string): string => {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') {
    end--
  }
  return url.slice(0, end)
}

class SafeApiKit {
  #chainId: bigint
  #apiKey?: string
  #queueServiceBaseUrl: string

  constructor({ chainId, queueServiceUrl, apiKey }: SafeApiKitConfig) {
    this.#chainId = chainId

    if (queueServiceUrl) {
      // If queueServiceUrl contains safe.global or 5afe.dev, apiKey is mandatory
      if (
        (queueServiceUrl.includes('api.safe.global') || queueServiceUrl.includes('api.5afe.dev')) &&
        !apiKey
      ) {
        throw new Error(
          'apiKey is mandatory when using api.safe.global or api.5afe.dev domains. Please obtain your API key at https://developer.safe.global.'
        )
      }
      this.#queueServiceBaseUrl = trimTrailingSlashes(queueServiceUrl)
    } else {
      // If queueServiceUrl is not defined, apiKey is mandatory
      if (!apiKey) {
        throw new Error(
          'apiKey is mandatory when queueServiceUrl is not defined. Please obtain your API key at https://developer.safe.global.'
        )
      }

      this.#queueServiceBaseUrl = DEFAULT_QUEUE_SERVICE_URL
    }

    this.#apiKey = apiKey
  }

  get #apiBaseUrl(): string {
    return `${this.#queueServiceBaseUrl}/api/v1`
  }

  #isValidAddress(address: string) {
    try {
      validateEthereumAddress(address)
      return true
    } catch {
      return false
    }
  }

  #getEip3770Address(fullAddress: string): Eip3770Address {
    return validateEip3770Address(fullAddress, this.#chainId)
  }

  /**
   * Adds the defined entries of an options object as query parameters of a given URL.
   *
   * @param {URL} url - The URL object to which query parameters will be added.
   * @param {QueryParams} params - An object containing key-value pairs representing query parameters.
   */
  #addUrlQueryParams(url: URL, params: QueryParams): void {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value.toString())
      }
    })
  }

  async #api<T>(request: HttpRequest): Promise<T> {
    return sendRequest(request, this.#apiKey)
  }

  /**
   * Returns the information of the service.
   *
   * @returns The version and build of the service
   */
  async getServiceInfo(): Promise<SafeServiceInfoResponse> {
    return this.#api({
      url: `${this.#apiBaseUrl}/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of delegates. At least one of `safeAddress`, `delegateAddress` or `delegatorAddress` is required.
   * The list includes the delegations of every chain. Check the `chainId` of each result: `null` means the delegation is valid on all chains.
   *
   * @param getSafeDelegateProps - Properties to filter the returned list of delegates
   * @returns The list of delegates
   * @throws "At least one of safeAddress, delegateAddress or delegatorAddress is required"
   * @throws "Checksum address validation failed"
   */
  async getSafeDelegates({
    safeAddress,
    delegateAddress,
    delegatorAddress,
    label,
    limit,
    offset
  }: GetSafeDelegateProps): Promise<SafeDelegateListResponse> {
    if (!safeAddress && !delegateAddress && !delegatorAddress) {
      throw new Error(
        'At least one of safeAddress, delegateAddress or delegatorAddress is required'
      )
    }

    const url = new URL(`${this.#apiBaseUrl}/delegates`)

    this.#addUrlQueryParams(url, {
      safe: safeAddress ? this.#getEip3770Address(safeAddress).address : undefined,
      delegate: delegateAddress ? this.#getEip3770Address(delegateAddress).address : undefined,
      delegator: delegatorAddress ? this.#getEip3770Address(delegatorAddress).address : undefined,
      label,
      limit,
      offset
    })

    return this.#api({
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
      label
    }: DeleteSafeDelegateProps & {
      label?: string
    }
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
    const safe = safeAddress ? this.#getEip3770Address(safeAddress).address : null
    const { address: delegate } = this.#getEip3770Address(delegateAddress)
    const { address: delegator } = this.#getEip3770Address(delegatorAddress)
    const signature = await signDelegate(signer, delegate, this.#chainId, action, safe ?? undefined)

    const body: Record<string, unknown> = {
      chainId: Number(this.#chainId),
      safe,
      delegate,
      delegator,
      signature
    }
    if (label !== undefined) {
      body.label = label
    }

    return this.#api({
      url: `${this.#apiBaseUrl}/delegates`,
      method,
      body
    })
  }

  /**
   * Adds a new delegate for a given Safe address, or for all the Safes of the delegator when no Safe address is provided.
   * The delegation is scoped to the chain of this SafeApiKit instance.
   *
   * @param addSafeDelegateProps - The configuration of the new delegate
   * @returns The created delegate
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "Checksum address validation failed"
   * @throws "Address <delegate_address> is not checksumed"
   */
  async addSafeDelegate(addSafeDelegateProps: AddSafeDelegateProps): Promise<SafeDelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Post, 'add', addSafeDelegateProps)
  }

  /**
   * Updates the label of an existing delegate.
   *
   * @param updateSafeDelegateProps - The configuration of the delegate with the new label
   * @returns The updated delegate
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "Checksum address validation failed"
   */
  async updateSafeDelegate(
    updateSafeDelegateProps: UpdateSafeDelegateProps
  ): Promise<SafeDelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Patch, 'edit', updateSafeDelegateProps)
  }

  /**
   * Removes a delegate. The scope (Safe address) must match the one used when the delegate was added.
   *
   * @param deleteSafeDelegateProps - The configuration for the delegate that will be removed
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Checksum address validation failed"
   */
  async removeSafeDelegate(deleteSafeDelegateProps: DeleteSafeDelegateProps): Promise<void> {
    return this.#sendDelegateRequest(HttpMethod.Delete, 'delete', deleteSafeDelegateProps)
  }

  /**
   * Get a message by its safe message hash
   * @param messageHash The Safe message hash
   * @returns The message
   */
  async getMessage(messageHash: string): Promise<SafeMessage> {
    if (!messageHash) {
      throw new Error('Invalid messageHash')
    }

    return this.#api({
      url: `${this.#apiBaseUrl}/messages/${messageHash}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Get the list of messages associated to a Safe account, newest first
   * @param safeAddress The safe address
   * @param options The pagination options
   * @returns The paginated list of messages
   */
  async getMessages(
    safeAddress: string,
    options: GetSafeMessageListOptions = {}
  ): Promise<SafeMessageListResponse> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    const url = new URL(`${this.#apiBaseUrl}/safes/${safeAddress}/messages`)

    this.#addUrlQueryParams(url, { chainId: this.#chainId, ...options })

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Creates a new message with an initial signature
   * Add more signatures from other owners using addMessageSignature()
   * @param safeAddress The safe address
   * @param options The raw message to add, the signature and the origin if any
   * @returns The created message
   */
  async addMessage(
    safeAddress: string,
    { message, signature, originName, originUrl }: AddMessageOptions
  ): Promise<SafeMessage> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    return this.#api({
      url: `${this.#apiBaseUrl}/safes/${safeAddress}/messages`,
      method: HttpMethod.Post,
      body: {
        chainId: Number(this.#chainId),
        message,
        signatures: [signature],
        originName,
        originUrl
      }
    })
  }

  /**
   * Add a signature to an existing message
   * @param messageHash The safe message hash
   * @param signature The signature
   * @returns The confirmations added by this request
   */
  async addMessageSignature(
    messageHash: string,
    signature: string
  ): Promise<SafeMessageConfirmation[]> {
    if (!messageHash || !signature) {
      throw new Error('Invalid messageHash or signature')
    }

    return this.#api({
      url: `${this.#apiBaseUrl}/messages/${messageHash}/signatures`,
      method: HttpMethod.Post,
      body: {
        signatures: [signature]
      }
    })
  }

  /**
   * Returns all the information of a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @returns The information of a Safe transaction
   * @throws "Invalid safeTxHash"
   * @throws "Not found."
   */
  async getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return this.#api({
      url: `${this.#apiBaseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction that will be confirmed
   * @param signature - Safe-encoded signature of the transaction. Several owner signatures can be packed together
   * @returns The confirmations added by this request
   * @throws "Invalid safeTxHash"
   * @throws "Invalid signature"
   */
  async confirmTransaction(
    safeTxHash: string,
    signature: string
  ): Promise<SafeMultisigConfirmationCreationResponse[]> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    if (signature === '') {
      throw new Error('Invalid signature')
    }
    return this.#api({
      url: `${this.#apiBaseUrl}/multisig-transactions/${safeTxHash}/signatures`,
      method: HttpMethod.Post,
      body: {
        signatures: [signature]
      }
    })
  }

  /**
   * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Queue Service.
   * The proposer is derived from the first signature: a Safe owner, an authorized delegate or an owner of a Safe that owns this Safe.
   *
   * @param proposeTransactionConfig - The configuration of the proposed transaction
   * @returns The stored transaction, including its `safeTxHash`
   * @throws "Invalid Safe address"
   * @throws "Invalid signature"
   */
  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    senderSignature,
    originName,
    originUrl,
    notes,
    nestedTransaction
  }: ProposeTransactionProps): Promise<SafeMultisigTransactionResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    if (!senderSignature) {
      throw new Error('Invalid signature')
    }
    const { address: safe } = this.#getEip3770Address(safeAddress)

    return this.#api({
      url: `${this.#apiBaseUrl}/multisig-transactions`,
      method: HttpMethod.Post,
      body: {
        ...safeTransactionData,
        chainId: Number(this.#chainId),
        safe,
        signatures: [senderSignature],
        originName,
        originUrl,
        notes,
        nestedTransaction
      }
    })
  }

  /**
   * Deletes a pending multi-signature transaction. Only the EOA that proposed it (the proposer, the delegate or the nested Safe owner) can delete it.
   *
   * @param deleteTransactionProps - The hash of the transaction to delete and the signer that proposed it
   * @returns
   * @throws "Invalid safeTxHash"
   * @throws "Not found."
   */
  async deleteTransaction({ safeTxHash, signer }: DeleteTransactionProps): Promise<void> {
    if (!safeTxHash) {
      throw new Error('Invalid safeTxHash')
    }
    const { safe } = await this.getTransaction(safeTxHash)
    const signature = await signDeleteTransaction(signer, safeTxHash, safe, this.#chainId)

    return this.#api({
      url: `${this.#apiBaseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Delete,
      body: { signature }
    })
  }

  /**
   * Returns the history of multi-signature transactions of a Safe account on the chain of this SafeApiKit instance.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of multi-signature transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getMultisigTransactions(
    safeAddress: string,
    options: GetMultisigTransactionsOptions = {}
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }

    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#apiBaseUrl}/safes/${address}/multisig-transactions`)

    this.#addUrlQueryParams(url, { chainId: this.#chainId, ...options })

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of multi-signature transactions that can still be executed: the ones that are not executed
   * and whose nonce is equal or higher than the current nonce of the Safe.
   *
   * @param safeAddress - The Safe address
   * @param {PendingTransactionsOptions} options The options to filter the list of transactions
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getPendingTransactions(
    safeAddress: string,
    options: PendingTransactionsOptions = {}
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }

    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#apiBaseUrl}/multisig-transactions/queue`)

    this.#addUrlQueryParams(url, { safes: `${address}:${this.#chainId}`, ...options })

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }
}

export default SafeApiKit
