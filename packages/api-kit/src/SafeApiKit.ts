import {
  AddMessageOptions,
  AddSafeDelegateProps,
  AddSafeOperationProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DeleteSafeDelegateProps,
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
  SafeMessageListResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeServiceInfoResponse,
  SafeSingletonResponse,
  SignatureResponse,
  SignedSafeDelegateResponse,
  TokenInfoListOptions,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from '@safe-global/api-kit/types/safeTransactionServiceTypes'
import { HttpMethod, HttpRequest, sendRequest } from '@safe-global/api-kit/utils/httpRequests'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
import {
  DataDecoded,
  Eip3770Address,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionResponse,
  SafeOperation,
  SafeOperationConfirmationListResponse,
  SafeOperationResponse,
  UserOperationV06
} from '@safe-global/types-kit'
import { getTransactionServiceUrl } from './utils/config'
import { isEmptyData } from './utils'
import { getAddSafeOperationProps, isSafeOperation } from './utils/safeOperation'
import { QUERY_PARAMS_MAP } from './utils/queryParamsMap'

export interface SafeApiKitConfig {
  /** chainId - The chainId */
  chainId: bigint
  /** txServiceUrl - Safe Transaction Service URL */
  txServiceUrl?: string
  /**
   * apiKey - The API key to access the Safe Transaction Service.
   * - Required if txServiceUrl is undefined
   * - Required if txServiceUrl contains "safe.global" or "5afe.dev"
   * - Optional otherwise
   */
  apiKey?: string
}

class SafeApiKit {
  #chainId: bigint
  #apiKey?: string
  #txServiceBaseUrl: string

  constructor({ chainId, txServiceUrl, apiKey }: SafeApiKitConfig) {
    this.#chainId = chainId

    if (txServiceUrl) {
      // If txServiceUrl contains safe.global or 5afe.dev, apiKey is mandatory
      if (
        (txServiceUrl.includes('api.safe.global') || txServiceUrl.includes('api.5afe.dev')) &&
        !apiKey
      ) {
        throw new Error(
          'apiKey is mandatory when using api.safe.global or api.5afe.dev domains. Please obtain your API key at https://developer.safe.global.'
        )
      }
      this.#txServiceBaseUrl = txServiceUrl
    } else {
      // If txServiceUrl is not defined, apiKey is mandatory
      if (!apiKey) {
        throw new Error(
          'apiKey is mandatory when txServiceUrl is not defined. Please obtain your API key at https://developer.safe.global.'
        )
      }

      const url = getTransactionServiceUrl(chainId)
      if (!url) {
        throw new TypeError(
          `There is no transaction service available for chainId ${chainId}. Please set the txServiceUrl property to use a custom transaction service.`
        )
      }

      this.#txServiceBaseUrl = url
    }

    this.#apiKey = apiKey
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
   * Adds query parameters from an options object to a given URL.
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

  async #api<T>(request: HttpRequest): Promise<T> {
    return sendRequest(request, this.#apiKey)
  }

  /**
   * Returns the information and configuration of the service.
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
   * Decodes the specified Safe transaction data.
   *
   * @param data - The Safe transaction data. '0x' prefixed hexadecimal string.
   * @param to - The address of the receiving contract. If provided, the decoded data will be more accurate, as in case of an ABI collision the Safe Transaction Service would know which ABI to use
   * @returns The transaction data decoded
   * @throws "Invalid data"
   * @throws "Not Found"
   * @throws "Ensure this field has at least 1 hexadecimal chars (not counting 0x)."
   */
  async decodeData(data: string, to?: string): Promise<DataDecoded> {
    if (data === '') {
      throw new Error('Invalid data')
    }

    const dataDecoderRequest: { data: string; to?: string } = { data }

    if (to) {
      dataDecoderRequest.to = to
    }

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/data-decoder/`,
      method: HttpMethod.Post,
      body: dataDecoderRequest
    })
  }

  /**
   * Returns the list of delegates.
   *
   * @param getSafeDelegateProps - Properties to filter the returned list of delegates
   * @returns The list of delegates
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
    const url = new URL(`${this.#txServiceBaseUrl}/v2/delegates`)

    if (safeAddress) {
      const { address: safe } = this.#getEip3770Address(safeAddress)
      url.searchParams.set('safe', safe)
    }
    if (delegateAddress) {
      const { address: delegate } = this.#getEip3770Address(delegateAddress)
      url.searchParams.set('delegate', delegate)
    }
    if (delegatorAddress) {
      const { address: delegator } = this.#getEip3770Address(delegatorAddress)
      url.searchParams.set('delegator', delegator)
    }
    if (label) {
      url.searchParams.set('label', label)
    }
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
   * Adds a new delegate for a given Safe address.
   *
   * @param addSafeDelegateProps - The configuration of the new delegate
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Invalid label"
   * @throws "Checksum address validation failed"
   * @throws "Address <delegate_address> is not checksumed"
   * @throws "Safe=<safe_address> does not exist or it's still not indexed"
   * @throws "Signing owner is not an owner of the Safe"
   */
  async addSafeDelegate({
    safeAddress,
    delegateAddress,
    delegatorAddress,
    label,
    signer
  }: AddSafeDelegateProps): Promise<SignedSafeDelegateResponse> {
    if (delegateAddress === '') {
      throw new Error('Invalid Safe delegate address')
    }
    if (delegatorAddress === '') {
      throw new Error('Invalid Safe delegator address')
    }
    if (label === '') {
      throw new Error('Invalid label')
    }
    const { address: delegate } = this.#getEip3770Address(delegateAddress)
    const { address: delegator } = this.#getEip3770Address(delegatorAddress)
    const signature = await signDelegate(signer, delegate, this.#chainId)

    const body = {
      safe: safeAddress ? this.#getEip3770Address(safeAddress).address : null,
      delegate,
      delegator,
      label,
      signature
    }
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v2/delegates/`,
      method: HttpMethod.Post,
      body
    })
  }

  /**
   * Removes a delegate for a given Safe address.
   *
   * @param deleteSafeDelegateProps - The configuration for the delegate that will be removed
   * @returns
   * @throws "Invalid Safe delegate address"
   * @throws "Invalid Safe delegator address"
   * @throws "Checksum address validation failed"
   * @throws "Signing owner is not an owner of the Safe"
   * @throws "Not found"
   */
  async removeSafeDelegate({
    delegateAddress,
    delegatorAddress,
    signer
  }: DeleteSafeDelegateProps): Promise<void> {
    if (delegateAddress === '') {
      throw new Error('Invalid Safe delegate address')
    }
    if (delegatorAddress === '') {
      throw new Error('Invalid Safe delegator address')
    }
    const { address: delegate } = this.#getEip3770Address(delegateAddress)
    const { address: delegator } = this.#getEip3770Address(delegatorAddress)
    const signature = await signDelegate(signer, delegate, this.#chainId)

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v2/delegates/${delegate}`,
      method: HttpMethod.Delete,
      body: {
        delegator,
        signature
      }
    })
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
      url: `${this.#txServiceBaseUrl}/v1/messages/${messageHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Get the list of messages associated to a Safe account
   * @param safeAddress The safe address
   * @param options The options to filter the list of messages
   * @returns The paginated list of messages
   */
  async getMessages(
    safeAddress: string,
    options: GetSafeMessageListOptions = {}
  ): Promise<SafeMessageListResponse> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<GetSafeMessageListOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Creates a new message with an initial signature
   * Add more signatures from other owners using addMessageSignature()
   * @param safeAddress The safe address
   * @param options The raw message to add, signature and safeAppId if any
   */
  async addMessage(safeAddress: string, addMessageOptions: AddMessageOptions): Promise<void> {
    if (!this.#isValidAddress(safeAddress)) {
      throw new Error('Invalid safeAddress')
    }

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`,
      method: HttpMethod.Post,
      body: addMessageOptions
    })
  }

  /**
   * Add a signature to an existing message
   * @param messageHash The safe message hash
   * @param signature The signature
   */
  async addMessageSignature(messageHash: string, signature: string): Promise<void> {
    if (!messageHash || !signature) {
      throw new Error('Invalid messageHash or signature')
    }

    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/messages/${messageHash}/signatures/`,
      method: HttpMethod.Post,
      body: {
        signature
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
      url: `${this.#txServiceBaseUrl}/v2/multisig-transactions/${safeTxHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of confirmations for a given a Safe transaction.
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
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction that will be confirmed
   * @param signature - Signature of the transaction
   * @returns
   * @throws "Invalid safeTxHash"
   * @throws "Invalid signature"
   * @throws "Malformed data"
   * @throws "Error processing data"
   */
  async confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    if (signature === '') {
      throw new Error('Invalid signature')
    }
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Post,
      body: {
        signature
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
   * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Transaction Service.
   *
   * @param proposeTransactionConfig - The configuration of the proposed transaction
   * @returns The hash of the Safe transaction proposed
   * @throws "Invalid Safe address"
   * @throws "Invalid safeTxHash"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address/User is not an owner/Invalid signature/Nonce already executed/Sender is not an owner"
   */
  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash,
    senderAddress,
    senderSignature,
    origin
  }: ProposeTransactionProps): Promise<void> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { address: safe } = this.#getEip3770Address(safeAddress)
    const { address: sender } = this.#getEip3770Address(senderAddress)
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return this.#api({
      url: `${this.#txServiceBaseUrl}/v2/safes/${safe}/multisig-transactions/`,
      method: HttpMethod.Post,
      body: {
        ...safeTransactionData,
        contractTransactionHash: safeTxHash,
        sender,
        signature: senderSignature,
        origin
      }
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
   * Returns the history of multi-signature transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of multi-signature transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getMultisigTransactions(
    safeAddress: string,
    options?: GetMultisigTransactionsOptions
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }

    const { address } = this.#getEip3770Address(safeAddress)
    const url = new URL(`${this.#txServiceBaseUrl}/v2/safes/${address}/multisig-transactions/`)

    // Check if options are given and add query parameters
    this.#addUrlQueryParams<GetMultisigTransactionsOptions>(url, options)

    return this.#api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.
   *
   * @param safeAddress - The Safe address
   * @param {PendingTransactionsOptions} options The options to filter the list of transactions
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "Invalid Safe address"
   * @throws "Invalid data"
   * @throws "Invalid ethereum address"
   */
  async getPendingTransactions(
    safeAddress: string,
    options: PendingTransactionsOptions = {}
  ): Promise<SafeMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const { currentNonce, hasConfirmations, ordering, limit, offset } = options

    const { address } = this.#getEip3770Address(safeAddress)
    const nonce = currentNonce ? currentNonce : (await this.getSafeInfo(address)).nonce

    const url = new URL(
      `${this.#txServiceBaseUrl}/v2/safes/${address}/multisig-transactions/?executed=false&nonce__gte=${nonce}`
    )

    if (hasConfirmations) {
      url.searchParams.set('has_confirmations', hasConfirmations.toString())
    }

    if (ordering) {
      url.searchParams.set('ordering', ordering)
    }

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
    const pendingTransactions = await this.getPendingTransactions(address)
    if (pendingTransactions.results.length > 0) {
      const maxNonce = pendingTransactions.results.reduce((acc, tx) => {
        const curr = BigInt(tx.nonce)
        return curr > acc ? curr : acc
      }, 0n)

      return (maxNonce + 1n).toString()
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

export default SafeApiKit
