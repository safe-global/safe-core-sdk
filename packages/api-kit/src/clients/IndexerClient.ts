import {
  SafeOperation,
  SafeOperationConfirmationListResponse,
  SafeOperationResponse,
  UserOperationV06
} from '@safe-global/types-kit'
import { HttpMethod } from '@safe-global/api-kit/utils/httpRequests'
import { isEmptyData } from '@safe-global/api-kit/utils'
import { getAddSafeOperationProps, isSafeOperation } from '@safe-global/api-kit/utils/safeOperation'
import { QUERY_PARAMS_MAP } from '@safe-global/api-kit/utils/queryParamsMap'
import {
  AddSafeOperationProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  GetIncomingTransactionsOptions,
  GetModuleTransactionsOptions,
  GetPendingSafeOperationListOptions,
  GetSafeOperationListOptions,
  GetSafeOperationListResponse,
  IndexerServiceInfoResponse,
  ModulesResponse,
  OwnerResponse,
  QueryParamsOptions,
  SafeCreationInfoResponse,
  SafeInfoResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeSingletonResponse,
  TokenInfoListOptions,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from '@safe-global/api-kit/types/indexerServiceTypes'
import { ChainOptions, ListOptions } from '@safe-global/api-kit/types/common'
import { getTransactionServiceUrl } from '@safe-global/api-kit/utils/config'
import { BaseClient, ServiceClientConfig } from './BaseClient'

export type IndexerClientConfig = Omit<ServiceClientConfig, 'baseUrl'> & {
  /** Custom service URL, serving only the `chainId` of the client. Defaults to the Safe hosted service of each chain */
  baseUrl?: string
}

/**
 * Client of the Safe Transaction Service, used for the data indexed from the chain
 * (Safe accounts, history, transfers, tokens) and for ERC-4337 SafeOperations. One method per endpoint of the service.
 */
export class IndexerClient extends BaseClient {
  readonly #hasCustomUrl: boolean

  constructor({ baseUrl, ...config }: IndexerClientConfig) {
    super({ ...config, baseUrl: baseUrl ?? '' })
    this.#hasCustomUrl = !!baseUrl
  }

  #getBaseUrl(chainId?: bigint, fullAddress?: string): string {
    const requestChainId = this.getChainId(chainId, fullAddress)

    if (this.#hasCustomUrl) {
      if (
        this.chainId !== undefined &&
        requestChainId !== undefined &&
        requestChainId !== this.chainId
      ) {
        throw new Error(
          `The indexer service at ${this.baseUrl} only serves chainId ${this.chainId}, not ${requestChainId}`
        )
      }
      return this.baseUrl
    }

    if (requestChainId === undefined) {
      throw new Error(
        'chainId is required. Pass it to the method, set a default chainId in the kit or set the indexerServiceUrl'
      )
    }
    try {
      return getTransactionServiceUrl(requestChainId)
    } catch {
      throw new TypeError(
        `There is no transaction service available for chainId ${requestChainId}. Please set the indexerServiceUrl property to use a custom transaction service.`
      )
    }
  }

  /**
   * Adds query parameters from an options object to a given URL.
   * Converts parameter names to snake_case automatically. If a specific mapping exists in QUERY_PARAMS_MAP,
   * it will be used instead of the converted name.
   */
  #addUrlQueryParams<T extends QueryParamsOptions>(url: URL, options?: T): void {
    const camelToSnake = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase()

    Object.entries(options || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        const name = QUERY_PARAMS_MAP[key] ?? camelToSnake(key)
        url.searchParams.set(name, value.toString())
      }
    })
  }

  /**
   * Returns the information and configuration of the service.
   *
   * @param options - Chain of the service
   * @returns The information and configuration of the service
   */
  async getServiceInfo({ chainId }: ChainOptions = {}): Promise<IndexerServiceInfoResponse> {
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safe singletons.
   *
   * @param options - Chain of the service
   * @returns The list of Safe singletons
   */
  async getServiceSingletonsInfo({ chainId }: ChainOptions = {}): Promise<SafeSingletonResponse[]> {
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/about/singletons`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safes where the address provided is an owner.
   *
   * @param ownerAddress - The owner address
   * @param options - Chain of the request
   * @returns The list of Safes where the address provided is an owner
   * @throws "Invalid owner address"
   * @throws "Checksum address validation failed"
   */
  async getSafesByOwner(
    ownerAddress: string,
    { chainId }: ChainOptions = {}
  ): Promise<OwnerResponse> {
    if (ownerAddress === '') {
      throw new Error('Invalid owner address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, ownerAddress)}/v1/owners/${this.getAddress(ownerAddress, chainId)}/safes/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safes where the module address provided is enabled.
   *
   * @param moduleAddress - The Safe module address
   * @param options - Chain of the request
   * @returns The list of Safe addresses where the module provided is enabled
   * @throws "Invalid module address"
   * @throws "Module address checksum not valid"
   */
  async getSafesByModule(
    moduleAddress: string,
    { chainId }: ChainOptions = {}
  ): Promise<ModulesResponse> {
    if (moduleAddress === '') {
      throw new Error('Invalid module address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, moduleAddress)}/v1/modules/${this.getAddress(moduleAddress, chainId)}/safes/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the information and configuration of the provided Safe address.
   *
   * @param safeAddress - The Safe address
   * @param options - Chain of the request
   * @returns The information and configuration of the provided Safe address
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getSafeInfo(
    safeAddress: string,
    { chainId }: ChainOptions = {}
  ): Promise<SafeInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/`,
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
   * @param options - Chain of the request
   * @returns The creation information of a Safe
   * @throws "Invalid Safe address"
   * @throws "Safe creation not found"
   * @throws "Checksum address validation failed"
   * @throws "Problem connecting to Ethereum network"
   */
  async getSafeCreationInfo(
    safeAddress: string,
    { chainId }: ChainOptions = {}
  ): Promise<SafeCreationInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/creation/`,
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
   * @param options - Chain of the request
   * @returns The safeTxGas for the given Safe transaction
   * @throws "Invalid Safe address"
   * @throws "Data not valid"
   * @throws "Safe not found"
   * @throws "Tx not valid"
   */
  async estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate,
    { chainId }: ChainOptions = {}
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/multisig-transactions/estimations/`,
      method: HttpMethod.Post,
      body: safeTransaction
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
    { chainId, ...options }: GetIncomingTransactionsOptions = {}
  ): Promise<TransferListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/incoming-transfers/`
    )
    this.#addUrlQueryParams<GetIncomingTransactionsOptions>(url, options)

    return this.api({
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
    { chainId, ...options }: GetModuleTransactionsOptions = {}
  ): Promise<SafeModuleTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/module-transactions/`
    )
    this.#addUrlQueryParams<GetModuleTransactionsOptions>(url, options)

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a list of transactions for a Safe. The list has different structures depending on the transaction type
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The list of transactions of the Safe
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   * @throws "Ordering field is not valid"
   */
  async getAllTransactions(
    safeAddress: string,
    { chainId, ...options }: AllTransactionsOptions = {}
  ): Promise<AllTransactionsListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId, safeAddress)}/v2/safes/${this.getAddress(safeAddress, chainId)}/all-transactions/`
    )
    this.#addUrlQueryParams<AllTransactionsOptions>(url, options)

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of all the ERC20 tokens handled by the Safe.
   *
   * @param options - Optional parameters to filter or modify the response
   * @returns The list of all the ERC20 tokens
   */
  async getTokenList({
    chainId,
    ...options
  }: TokenInfoListOptions = {}): Promise<TokenInfoListResponse> {
    const url = new URL(`${this.#getBaseUrl(chainId)}/v1/tokens/`)
    this.#addUrlQueryParams<TokenInfoListOptions>(url, options)

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the information of a given ERC20 token.
   *
   * @param tokenAddress - The token address
   * @param options - Chain of the request
   * @returns The information of the given ERC20 token
   * @throws "Invalid token address"
   * @throws "Checksum address validation failed"
   */
  async getToken(tokenAddress: string, { chainId }: ChainOptions = {}): Promise<TokenInfoResponse> {
    if (tokenAddress === '') {
      throw new Error('Invalid token address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId, tokenAddress)}/v1/tokens/${this.getAddress(tokenAddress, chainId)}/`,
      method: HttpMethod.Get
    })
  }

  // ERC-4337 SafeOperations

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
    { chainId, ...options }: GetSafeOperationListOptions = {}
  ): Promise<GetSafeOperationListResponse> {
    if (!safeAddress) {
      throw new Error('Safe address must not be empty')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId, safeAddress)}/v1/safes/${this.getAddress(safeAddress, chainId)}/safe-operations/`
    )
    this.#addUrlQueryParams<GetSafeOperationListOptions>(url, options)

    return this.api({
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
   * @param options - Chain of the request
   * @throws "SafeOperation hash must not be empty"
   * @throws "Not found."
   * @returns The SafeOperation
   */
  async getSafeOperation(
    safeOperationHash: string,
    { chainId }: ChainOptions = {}
  ): Promise<SafeOperationResponse> {
    if (!safeOperationHash) {
      throw new Error('SafeOperation hash must not be empty')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safe-operations/${safeOperationHash}/`,
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
      addSafeOperationProps = {
        ...(await getAddSafeOperationProps(safeOperation)),
        chainId: safeOperation.options.chainId
      }
    } else {
      addSafeOperationProps = safeOperation
    }

    const {
      entryPoint,
      moduleAddress: moduleAddressProp,
      options,
      safeAddress: safeAddressProp,
      userOperation,
      chainId
    } = addSafeOperationProps
    if (!safeAddressProp) {
      throw new Error('Safe address must not be empty')
    }
    try {
      safeAddress = this.getAddress(safeAddressProp, chainId)
    } catch {
      throw new Error(`Invalid Safe address ${safeAddressProp}`)
    }

    if (!moduleAddressProp) {
      throw new Error('Module address must not be empty')
    }

    try {
      moduleAddress = this.getAddress(moduleAddressProp, chainId)
    } catch {
      throw new Error(`Invalid module address ${moduleAddressProp}`)
    }

    if (isEmptyData(userOperation.signature)) {
      throw new Error('Signature must not be empty')
    }

    // We are receiving the timestamp in seconds (block timestamp), but the API expects it in milliseconds
    const getISOString = (date: number | undefined) =>
      !date ? null : new Date(date * 1000).toISOString()

    const userOperationV06 = userOperation as UserOperationV06

    return this.api({
      url: `${this.#getBaseUrl(chainId, safeAddressProp)}/v1/safes/${safeAddress}/safe-operations/`,
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
   * @param options - Chain and pagination
   * @returns The list of confirmations
   * @throws "Invalid SafeOperation hash"
   * @throws "Invalid data"
   */
  async getSafeOperationConfirmations(
    safeOperationHash: string,
    { chainId, limit, offset }: ListOptions & ChainOptions = {}
  ): Promise<SafeOperationConfirmationListResponse> {
    if (!safeOperationHash) {
      throw new Error('Invalid SafeOperation hash')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v1/safe-operations/${safeOperationHash}/confirmations/`
    )
    this.addQueryParams(url, { limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a SafeOperation.
   *
   * @param safeOperationHash The SafeOperation hash
   * @param signature - Signature of the SafeOperation
   * @param options - Chain of the request
   * @throws "Invalid SafeOperation hash"
   * @throws "Invalid signature"
   * @throws "Malformed data"
   * @throws "Error processing data"
   */
  async confirmSafeOperation(
    safeOperationHash: string,
    signature: string,
    { chainId }: ChainOptions = {}
  ): Promise<void> {
    if (!safeOperationHash) {
      throw new Error('Invalid SafeOperation hash')
    }
    if (!signature) {
      throw new Error('Invalid signature')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safe-operations/${safeOperationHash}/confirmations/`,
      method: HttpMethod.Post,
      body: { signature }
    })
  }
}
