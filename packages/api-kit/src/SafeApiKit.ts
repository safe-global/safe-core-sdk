import {
  AddMessageOptions,
  AddSafeDelegateProps,
  AddSafeOperationProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DecodeDataResponse,
  DeleteSafeDelegateProps,
  DeleteTransactionProps,
  GetIncomingTransactionsOptions,
  GetModuleTransactionsOptions,
  GetMultisigTransactionsOptions,
  GetPendingSafeOperationListOptions,
  GetSafeDelegateProps,
  GetSafeMessageListOptions,
  GetSafeOperationListOptions,
  GetSafeOperationListResponse,
  ListOptions,
  ModulesResponse,
  OwnerResponse,
  PendingTransactionsOptions,
  ProposeTransactionProps,
  QueryParamsOptions,
  SafeCreationInfoResponse,
  SafeDelegateListResponse,
  SafeInfoResponse,
  SafeMessage,
  SafeMessageConfirmation,
  SafeMessageListResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigConfirmationCreationResponse,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeServiceInfoResponse,
  SafeSingletonResponse,
  SignedSafeDelegateResponse,
  TokenInfoListOptions,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse,
  UpdateSafeDelegateProps
} from '@safe-global/api-kit/types/safeTransactionServiceTypes'
import {
  HttpError,
  HttpMethod,
  HttpRequest,
  sendRequest
} from '@safe-global/api-kit/utils/httpRequests'
import { DelegateAction, signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
import {
  Eip3770Address,
  SafeMultisigTransactionResponse,
  SafeOperation,
  SafeOperationConfirmationListResponse,
  SafeOperationResponse,
  UserOperationV06
} from '@safe-global/types-kit'
import {
  DEFAULT_DECODER_SERVICE_URL,
  DEFAULT_QUEUE_SERVICE_URL,
  getTransactionServiceUrl
} from './utils/config'
import { isEmptyData } from './utils'
import { getAddSafeOperationProps, isSafeOperation } from './utils/safeOperation'
import { QUERY_PARAMS_MAP } from './utils/queryParamsMap'

export interface SafeApiKitConfig {
  /** chainId - The chainId */
  chainId: bigint
  /**
   * txServiceUrl - Safe Transaction Service URL. Used for the endpoints backed by the indexer:
   * Safe info and creation, transaction history, transfers, tokens, data and SafeOperations.
   * Defaults to the Safe hosted service of the chain.
   */
  txServiceUrl?: string
  /**
   * queueServiceUrl - Safe Queue Service URL. Used for the off-chain queue: multisig transaction
   * proposals and confirmations, off-chain messages and delegates. The service is multi-chain,
   * so the same URL works for every chain. Defaults to the Safe hosted service.
   */
  queueServiceUrl?: string
  /**
   * decoderServiceUrl - Safe Decoder Service URL. Used to decode transaction data.
   * Defaults to the Safe hosted service.
   */
  decoderServiceUrl?: string
  /**
   * apiKey - The API key to access the Safe services.
   * - Required if any of the service URLs is undefined
   * - Required if any of the service URLs contains "safe.global" or "5afe.dev"
   * - Optional otherwise
   */
  apiKey?: string
}

type QueryParams = Record<string, string | number | boolean | bigint | undefined>

const API_KEY_HELP = 'Please obtain your API key at https://developer.safe.global.'

const isSafeHostedUrl = (url: string) =>
  url.includes('api.safe.global') || url.includes('api.5afe.dev')

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
  #txServiceBaseUrl: string
  #queueServiceBaseUrl: string
  #decoderServiceBaseUrl: string

  constructor({
    chainId,
    txServiceUrl,
    queueServiceUrl,
    decoderServiceUrl,
    apiKey
  }: SafeApiKitConfig) {
    this.#chainId = chainId

    if (txServiceUrl) {
      // If txServiceUrl contains safe.global or 5afe.dev, apiKey is mandatory
      if (isSafeHostedUrl(txServiceUrl) && !apiKey) {
        throw new Error(
          `apiKey is mandatory when using api.safe.global or api.5afe.dev domains. ${API_KEY_HELP}`
        )
      }
      this.#txServiceBaseUrl = txServiceUrl
    } else {
      // If txServiceUrl is not defined, apiKey is mandatory
      if (!apiKey) {
        throw new Error(`apiKey is mandatory when txServiceUrl is not defined. ${API_KEY_HELP}`)
      }

      const url = getTransactionServiceUrl(chainId)
      if (!url) {
        throw new TypeError(
          `There is no transaction service available for chainId ${chainId}. Please set the txServiceUrl property to use a custom transaction service.`
        )
      }

      this.#txServiceBaseUrl = url
    }

    this.#queueServiceBaseUrl = this.#resolveServiceUrl(
      'queueServiceUrl',
      queueServiceUrl,
      DEFAULT_QUEUE_SERVICE_URL,
      apiKey
    )
    this.#decoderServiceBaseUrl = this.#resolveServiceUrl(
      'decoderServiceUrl',
      decoderServiceUrl,
      DEFAULT_DECODER_SERVICE_URL,
      apiKey
    )

    this.#apiKey = apiKey
  }

  #resolveServiceUrl(
    name: 'queueServiceUrl' | 'decoderServiceUrl',
    url: string | undefined,
    defaultUrl: string,
    apiKey?: string
  ): string {
    if (url) {
      if (isSafeHostedUrl(url) && !apiKey) {
        throw new Error(
          `apiKey is mandatory when using api.safe.global or api.5afe.dev domains. ${API_KEY_HELP}`
        )
      }
      return `${trimTrailingSlashes(url)}/api/v1`
    }
    if (!apiKey) {
      throw new Error(`apiKey is mandatory when ${name} is not defined. ${API_KEY_HELP}`)
    }
    return `${defaultUrl}/api/v1`
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
   * Adds query parameters from an options object to a given Safe Transaction Service URL.
   * Converts parameter names to snake_case automatically. If a specific mapping exists in QUERY_PARAMS_MAP,
   * it will be used instead of the converted name.
   *
   * @param {URL} url - The URL object to which query parameters will be added.
   * @param {T} options - An object containing key-value pairs representing query parameters.
   * @returns {void}
   */
  #addUrlQueryParams<T extends QueryParamsOptions>(url: URL, options?: T): void {
    const camelToSnake = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

    // Handle any additional query parameters
    Object.entries(options || {}).forEach(([key, value]) => {
      // Skip undefined values
      if (value !== undefined) {
        const name = QUERY_PARAMS_MAP[key] ?? camelToSnake(key)
        // Add options as query parameters
        url.searchParams.set(name, value.toString())
      }
    })
  }

  /**
   * Adds the defined entries of a params object as query parameters of a given Safe Queue Service URL.
   * The Safe Queue Service uses camelCase query parameters, so the names are kept as they are.
   *
   * @param {URL} url - The URL object to which query parameters will be added.
   * @param {QueryParams} params - An object containing key-value pairs representing query parameters.
   */
  #addQueueUrlQueryParams(url: URL, params: QueryParams): void {
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
   * Returns the information and configuration of the Safe Transaction Service.
   *
   * @returns The information and configuration of the service
   */
  async getServiceInfo(): Promise<SafeServiceInfoResponse> {
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safe singletons.
   *
   * @returns The list of Safe singletons
   */
  async getServiceSingletonsInfo(): Promise<SafeSingletonResponse[]> {
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/about/singletons`,
      method: HttpMethod.Get
    })
  }

  /**
   * Decodes the specified Safe transaction data using the Safe Decoder Service.
   *
   * @param data - The Safe transaction data. '0x' prefixed hexadecimal string.
   * @param to - The address of the receiving contract. If provided, the decoded data will be more accurate, as in case of an ABI collision the Safe Decoder Service would know which ABI to use
   * @returns The transaction data decoded, with the accuracy of the decoding
   * @throws "Invalid data"
   * @throws "Cannot find function selector to decode data"
   */
  async decodeData(data: string, to?: string): Promise<DecodeDataResponse> {
    if (data === '') {
      throw new Error('Invalid data')
    }

    const dataDecoderRequest: { data: string; to?: string; chainId?: number } = { data }

    if (to) {
      dataDecoderRequest.to = to
      // The chainId can only be used to pick the ABI when the receiving contract is known
      dataDecoderRequest.chainId = Number(this.#chainId)
    }

    return this.#api({
      url: `${this.#decoderServiceBaseUrl}/data-decoder`,
      method: HttpMethod.Post,
      body: dataDecoderRequest
    })
  }

  /**
   * Returns the list of delegates. At least one of `safeAddress`, `delegateAddress` or `delegatorAddress` is required.
   * The list includes the delegations of every chain. Check the `chainId` of each result: `null` means the delegation is valid on all chains.
   *
   * @param getSafeDelegateProps - Properties to filter the returned list of delegates
   * @returns The list of delegates
   * @throws "At least one of safeAddress, delegateAddress or delegatorAddress is required"
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

    const url = new URL(`${this.#queueServiceBaseUrl}/delegates`)

    this.#addQueueUrlQueryParams(url, {
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
  ): Promise<T & { signature: string }> {
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

    const response = await this.#api<T>({
      url: `${this.#queueServiceBaseUrl}/delegates`,
      method,
      body
    })

    return { ...response, signature }
  }

  /**
   * Adds a new delegate for a given Safe address, or for all the Safes of the delegator when no Safe address is provided.
   * The delegation is scoped to the chain of this SafeApiKit instance.
   *
   * @param addSafeDelegateProps - The configuration of the new delegate
   * @returns The created delegate and the signature sent to the service
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "Delegate cannot be the same as delegator"
   */
  async addSafeDelegate(
    addSafeDelegateProps: AddSafeDelegateProps
  ): Promise<SignedSafeDelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Post, 'add', addSafeDelegateProps)
  }

  /**
   * Updates the label of an existing delegate. The scope (Safe address) must match the one used when the delegate was added.
   *
   * @param updateSafeDelegateProps - The configuration of the delegate with the new label
   * @returns The updated delegate and the signature sent to the service
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "No matching delegates found"
   */
  async updateSafeDelegate(
    updateSafeDelegateProps: UpdateSafeDelegateProps
  ): Promise<SignedSafeDelegateResponse> {
    return this.#sendDelegateRequest(HttpMethod.Patch, 'edit', updateSafeDelegateProps)
  }

  /**
   * Removes a delegate. The scope (Safe address) must match the one used when the delegate was added.
   *
   * @param deleteSafeDelegateProps - The configuration for the delegate that will be removed
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "No matching delegates found"
   */
  async removeSafeDelegate(deleteSafeDelegateProps: DeleteSafeDelegateProps): Promise<void> {
    await this.#sendDelegateRequest(HttpMethod.Delete, 'delete', deleteSafeDelegateProps)
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
      url: `${this.#queueServiceBaseUrl}/messages/${messageHash}`,
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

    const url = new URL(`${this.#queueServiceBaseUrl}/safes/${safeAddress}/messages`)

    this.#addQueueUrlQueryParams(url, { chainId: this.#chainId, ...options })

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
      url: `${this.#queueServiceBaseUrl}/safes/${safeAddress}/messages`,
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
      url: `${this.#queueServiceBaseUrl}/messages/${messageHash}/signatures`,
      method: HttpMethod.Post,
      body: {
        signatures: [signature]
      }
    })
  }

  /**
   * Returns the list of Safes where the address provided is an owner.
   *
   * @param ownerAddress - The owner address
   * @returns The list of Safes where the address provided is an owner
   * @throws "Invalid owner address"
   * @throws "Checksum address validation failed"
   */
  async getSafesByOwner(ownerAddress: string): Promise<OwnerResponse> {
    if (ownerAddress === '') {
      throw new Error('Invalid owner address')
    }
    const { address } = this.#getEip3770Address(ownerAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/owners/${address}/safes/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safes where the module address provided is enabled.
   *
   * @param moduleAddress - The Safe module address
   * @returns The list of Safe addresses where the module provided is enabled
   * @throws "Invalid module address"
   * @throws "Module address checksum not valid"
   */
  async getSafesByModule(moduleAddress: string): Promise<ModulesResponse> {
    if (moduleAddress === '') {
      throw new Error('Invalid module address')
    }
    const { address } = this.#getEip3770Address(moduleAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/modules/${address}/safes/`,
      method: HttpMethod.Get
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
      url: `${this.#queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of confirmations for a given a Safe transaction.
   * An empty list is returned when the transaction does not exist.
   *
   * @param safeTxHash - The hash of the Safe transaction
   * @returns The list of confirmations
   * @throws "Invalid safeTxHash"
   */
  async getTransactionConfirmations(
    safeTxHash: string
  ): Promise<SafeMultisigConfirmationListResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    try {
      const { confirmations } = await this.getTransaction(safeTxHash)
      return { count: confirmations.length, results: confirmations }
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 404) {
        return { count: 0, results: [] }
      }
      throw error
    }
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
      url: `${this.#queueServiceBaseUrl}/multisig-transactions/${safeTxHash}/signatures`,
      method: HttpMethod.Post,
      body: {
        signatures: [signature]
      }
    })
  }

  /**
   * Returns the information and configuration of the provided Safe address.
   *
   * @param safeAddress - The Safe address
   * @returns The information and configuration of the provided Safe address
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getSafeInfo(safeAddress: string): Promise<SafeInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/`,
      method: HttpMethod.Get
    }).then((response: any) => {
      // FIXME remove when the transaction service returns the singleton property instead of masterCopy
      if (!response?.singleton) {
        const { masterCopy, ...rest } = response
        return { ...rest, singleton: masterCopy } as SafeInfoResponse
      }

      return response as SafeInfoResponse
    })
  }

  /**
   * Returns the creation information of a Safe.
   *
   * @param safeAddress - The Safe address
   * @returns The creation information of a Safe
   * @throws "Invalid Safe address"
   * @throws "Safe creation not found"
   * @throws "Checksum address validation failed"
   * @throws "Problem connecting to Ethereum network"
   */
  async getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/creation/`,
      method: HttpMethod.Get
    }).then((response: any) => {
      // FIXME remove when the transaction service returns the singleton property instead of masterCopy
      if (!response?.singleton) {
        const { masterCopy, ...rest } = response
        return { ...rest, singleton: masterCopy } as SafeCreationInfoResponse
      }

      return response as SafeCreationInfoResponse
    })
  }

  /**
   * Estimates the safeTxGas for a given Safe multi-signature transaction.
   *
   * @param safeAddress - The Safe address
   * @param safeTransaction - The Safe transaction to estimate
   * @returns The safeTxGas for the given Safe transaction
   * @throws "Invalid Safe address"
   * @throws "Data not valid"
   * @throws "Safe not found"
   * @throws "Tx not valid"
   */
  async estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safes/${address}/multisig-transactions/estimations/`,
      method: HttpMethod.Post,
      body: safeTransaction
    })
  }

  /**
   * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Queue Service.
   * The proposer is derived from the signature: a Safe owner, an authorized delegate or an owner of a Safe that owns this Safe.
   *
   * @param proposeTransactionConfig - The configuration of the proposed transaction
   * @returns The stored transaction, including its `safeTxHash`
   * @throws "Invalid Safe address"
   * @throws "Invalid signature"
   * @throws "The safeTxHash <hash> does not match the hash calculated by the service <hash>"
   */
  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash,
    senderSignature,
    origin,
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
    const parsedOrigin = parseOrigin(origin)

    const transaction = await this.#api<SafeMultisigTransactionResponse>({
      url: `${this.#queueServiceBaseUrl}/multisig-transactions`,
      method: HttpMethod.Post,
      body: {
        ...safeTransactionData,
        chainId: Number(this.#chainId),
        safe,
        signatures: [senderSignature],
        originName: originName ?? parsedOrigin.originName,
        originUrl: originUrl ?? parsedOrigin.originUrl,
        notes,
        nestedTransaction
      }
    })

    if (safeTxHash && safeTxHash.toLowerCase() !== transaction.safeTxHash.toLowerCase()) {
      throw new Error(
        `The safeTxHash ${safeTxHash} does not match the hash calculated by the service ${transaction.safeTxHash}`
      )
    }

    return transaction
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
      url: `${this.#queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
      method: HttpMethod.Delete,
      body: { signature }
    })
  }

  /**
   * Returns the history of incoming transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of incoming transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getIncomingTransactions(
    safeAddress: string,
    options?: GetIncomingTransactionsOptions
  ): Promise<TransferListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/incoming-transfers/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<GetIncomingTransactionsOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of module transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of module transactions
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getModuleTransactions(
    safeAddress: string,
    options?: GetModuleTransactionsOptions
  ): Promise<SafeModuleTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/module-transactions/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<GetModuleTransactionsOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of multi-signature transactions of a Safe account on the chain of this SafeApiKit instance.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of multi-signature transactions
   * @throws "Invalid Safe address"
   */
  async getMultisigTransactions(
    safeAddress: string,
    options: GetMultisigTransactionsOptions = {}
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }

    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#queueServiceBaseUrl}/safes/${address}/multisig-transactions`)

    this.#addQueueUrlQueryParams(url, { chainId: this.#chainId, ...options })

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners:
   * the ones that are not executed and whose nonce is equal or higher than the current nonce of the Safe.
   *
   * @param safeAddress - The Safe address
   * @param {PendingTransactionsOptions} options The options to filter the list of transactions
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   */
  async getPendingTransactions(
    safeAddress: string,
    options: PendingTransactionsOptions = {}
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }

    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#queueServiceBaseUrl}/multisig-transactions/queue`)

    this.#addQueueUrlQueryParams(url, { safes: `${address}:${this.#chainId}`, ...options })

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a list of transactions for a Safe. The list has different structures depending on the transaction type
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   * @throws "Ordering field is not valid"
   */
  async getAllTransactions(
    safeAddress: string,
    options?: AllTransactionsOptions
  ): Promise<AllTransactionsListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v2/safes/${address}/all-transactions/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<AllTransactionsOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the right nonce to propose a new transaction after the last pending transaction.
   *
   * @param safeAddress - The Safe address
   * @returns The right nonce to propose a new transaction after the last pending transaction
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getNextNonce(safeAddress: string): Promise<string> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address } = this.#getEip3770Address(safeAddress)
    // The pending transaction with the highest nonce is the first one when sorting by nonce descending
    const { results } = await this.getPendingTransactions(address, { nonceOrder: 'desc', limit: 1 })
    if (results.length > 0) {
      return (BigInt(results[0].nonce) + 1n).toString()
    }
    const safeInfo = await this.getSafeInfo(address)
    return safeInfo.nonce
  }

  /**
   * Returns the list of all the ERC20 tokens handled by the Safe.
   *
   * @param options - Optional parameters to filter or modify the response
   * @returns The list of all the ERC20 tokens
   */
  async getTokenList(options?: TokenInfoListOptions): Promise<TokenInfoListResponse> {
    const url = new URL(`${this.#txServiceBaseUrl}/v1/tokens/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<TokenInfoListOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the information of a given ERC20 token.
   *
   * @param tokenAddress - The token address
   * @returns The information of the given ERC20 token
   * @throws "Invalid token address"
   * @throws "Checksum address validation failed"
   */
  async getToken(tokenAddress: string): Promise<TokenInfoResponse> {
    if (tokenAddress === '') {
      throw new Error('Invalid token address')
    }
    const { address } = this.#getEip3770Address(tokenAddress)
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/tokens/${address}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Get the SafeOperations that were sent from a particular address.
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @throws "Safe address must not be empty"
   * @throws "Invalid Ethereum address {safeAddress}"
   * @returns The SafeOperations sent from the given Safe's address
   */
  async getSafeOperationsByAddress(
    safeAddress: string,
    options?: GetSafeOperationListOptions
  ): Promise<GetSafeOperationListResponse> {
    if (!safeAddress) {
      throw new Error('Safe address must not be empty')
    }

    const { address } = this.#getEip3770Address(safeAddress)

    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/safe-operations/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<TokenInfoListOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Get the SafeOperations that are pending to send to the bundler
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @throws "Safe address must not be empty"
   * @throws "Invalid Ethereum address {safeAddress}"
   * @returns The pending SafeOperations
   */
  async getPendingSafeOperations(
    safeAddress: string,
    options?: GetPendingSafeOperationListOptions
  ): Promise<GetSafeOperationListResponse> {
    return this.getSafeOperationsByAddress(safeAddress, {
      ...options,
      executed: false
    })
  }

  /**
   * Get a SafeOperation by its hash.
   * @param safeOperationHash The SafeOperation hash
   * @throws "SafeOperation hash must not be empty"
   * @throws "Not found."
   * @returns The SafeOperation
   */
  async getSafeOperation(safeOperationHash: string): Promise<SafeOperationResponse> {
    if (!safeOperationHash) {
      throw new Error('SafeOperation hash must not be empty')
    }

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safe-operations/${safeOperationHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Create a new 4337 SafeOperation for a Safe.
   * @param addSafeOperationProps - The configuration of the SafeOperation
   * @throws "Safe address must not be empty"
   * @throws "Invalid Safe address {safeAddress}"
   * @throws "Module address must not be empty"
   * @throws "Invalid module address {moduleAddress}"
   * @throws "Signature must not be empty"
   */
  async addSafeOperation(safeOperation: AddSafeOperationProps | SafeOperation): Promise<void> {
    let safeAddress: string, moduleAddress: string
    let addSafeOperationProps: AddSafeOperationProps

    if (isSafeOperation(safeOperation)) {
      addSafeOperationProps = await getAddSafeOperationProps(safeOperation)
    } else {
      addSafeOperationProps = safeOperation
    }

    const {
      entryPoint,
      moduleAddress: moduleAddressProp,
      options,
      safeAddress: safeAddressProp,
      userOperation
    } = addSafeOperationProps
    if (!safeAddressProp) {
      throw new Error('Safe address must not be empty')
    }
    try {
      safeAddress = this.#getEip3770Address(safeAddressProp).address
    } catch (err) {
      throw new Error(`Invalid Safe address ${safeAddressProp}`)
    }

    if (!moduleAddressProp) {
      throw new Error('Module address must not be empty')
    }

    try {
      moduleAddress = this.#getEip3770Address(moduleAddressProp).address
    } catch (err) {
      throw new Error(`Invalid module address ${moduleAddressProp}`)
    }

    if (isEmptyData(userOperation.signature)) {
      throw new Error('Signature must not be empty')
    }

    // We are receiving the timestamp in seconds (block timestamp), but the API expects it in milliseconds
    const getISOString = (date: number | undefined) =>
      !date ? null : new Date(date * 1000).toISOString()

    const userOperationV06 = userOperation as UserOperationV06

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/safe-operations/`,
      method: HttpMethod.Post,
      body: {
        initCode: isEmptyData(userOperationV06.initCode) ? null : userOperationV06.initCode,
        nonce: userOperation.nonce,
        callData: userOperation.callData,
        callGasLimit: userOperation.callGasLimit.toString(),
        verificationGasLimit: userOperation.verificationGasLimit.toString(),
        preVerificationGas: userOperation.preVerificationGas.toString(),
        maxFeePerGas: userOperation.maxFeePerGas.toString(),
        maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
        paymasterAndData: isEmptyData(userOperationV06.paymasterAndData)
          ? null
          : userOperationV06.paymasterAndData,
        entryPoint,
        validAfter: getISOString(options?.validAfter),
        validUntil: getISOString(options?.validUntil),
        signature: userOperation.signature,
        moduleAddress
      }
    })
  }

  /**
   * Returns the list of confirmations for a given a SafeOperation.
   *
   * @param safeOperationHash - The hash of the SafeOperation to get confirmations for
   * @param getSafeOperationConfirmationsOptions - Additional options for fetching the list of confirmations
   * @returns The list of confirmations
   * @throws "Invalid SafeOperation hash"
   * @throws "Invalid data"
   */
  async getSafeOperationConfirmations(
    safeOperationHash: string,
    { limit, offset }: ListOptions = {}
  ): Promise<SafeOperationConfirmationListResponse> {
    if (!safeOperationHash) {
      throw new Error('Invalid SafeOperation hash')
    }

    const url = new URL(
      `${this.#txServiceBaseUrl}/v1/safe-operations/${safeOperationHash}/confirmations/`
    )

    if (limit != null) {
      url.searchParams.set('limit', limit.toString())
    }

    if (offset != null) {
      url.searchParams.set('offset', offset.toString())
    }

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a SafeOperation.
   *
   * @param safeOperationHash The SafeOperation hash
   * @param signature - Signature of the SafeOperation
   * @returns
   * @throws "Invalid SafeOperation hash"
   * @throws "Invalid signature"
   * @throws "Malformed data"
   * @throws "Error processing data"
   */
  async confirmSafeOperation(safeOperationHash: string, signature: string): Promise<void> {
    if (!safeOperationHash) {
      throw new Error('Invalid SafeOperation hash')
    }
    if (!signature) {
      throw new Error('Invalid signature')
    }
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safe-operations/${safeOperationHash}/confirmations/`,
      method: HttpMethod.Post,
      body: { signature }
    })
  }
}

/**
 * Splits the legacy `origin` string of a proposal into the `originName` and `originUrl` fields of the Safe Queue Service.
 * Safe{Wallet} and the Safe Apps SDK send a JSON string with `name` and `url`; any other string is used as the name.
 */
function parseOrigin(origin?: string): { originName?: string; originUrl?: string } {
  if (!origin) {
    return {}
  }
  try {
    const parsed = JSON.parse(origin)
    if (parsed && typeof parsed === 'object' && (parsed.name || parsed.url)) {
      return {
        originName: typeof parsed.name === 'string' ? parsed.name : undefined,
        originUrl: typeof parsed.url === 'string' ? parsed.url : undefined
      }
    }
  } catch {
    // Not a JSON origin, use it as the name
  }
  return { originName: origin }
}

export default SafeApiKit
