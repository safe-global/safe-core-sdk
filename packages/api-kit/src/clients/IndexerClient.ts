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
  GetMultisigTransactionsOptions,
  GetPendingSafeOperationListOptions,
  GetSafeOperationListOptions,
  GetSafeOperationListResponse,
  IndexerMultisigTransactionListResponse,
  IndexerMultisigTransactionResponse,
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
import { ListOptions, RequiredChainOptions } from '@safe-global/api-kit/types/common'
import { getTransactionServiceUrl } from '@safe-global/api-kit/utils/config'
import { BaseClient, ServiceClientConfig } from './BaseClient'

export type IndexerUrl = {
  chainId: bigint
  /** Safe Transaction Service URL, including the `/api` path (e.g. `https://my-indexer.example.com/api`) */
  url: string
}

export type IndexerClientConfig = Omit<ServiceClientConfig, 'baseUrl'> & {
  /** Custom service URLs. The chains without one use the Safe hosted service */
  urls?: IndexerUrl[]
}

/**
 * Client of the Safe Transaction Service: the data indexed from the chain (Safe accounts, history, transfers, tokens)
 * and the ERC-4337 SafeOperations. One method per endpoint. A service indexes a single chain, so each request
 * goes to the service of its `chainId`.
 */
export class IndexerClient extends BaseClient {
  readonly #urls: Map<bigint, string>

  constructor({ urls = [], apiKey }: IndexerClientConfig) {
    super({ baseUrl: '', apiKey })
    this.#urls = new Map(urls.map(({ chainId, url }) => [BigInt(chainId), url]))
  }

  #getBaseUrl(requestChainId: bigint): string {
    const customUrl = this.#urls.get(requestChainId)
    if (customUrl) {
      return customUrl
    }

    if (!this.apiKey) {
      throw new Error(
        `apiKey is mandatory to use the Safe hosted indexer of chainId ${requestChainId}. Set it or add the chain to indexerUrls. Please obtain your API key at https://developer.safe.global.`
      )
    }
    try {
      return getTransactionServiceUrl(requestChainId)
    } catch {
      throw new TypeError(
        `There is no transaction service available for chainId ${requestChainId}. Add its URL to indexerUrls.`
      )
    }
  }

  /** Adds the defined options as query parameters, named as in QUERY_PARAMS_MAP or in snake_case */
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
  async getServiceInfo({ chainId }: RequiredChainOptions): Promise<IndexerServiceInfoResponse> {
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
  async getServiceSingletonsInfo({
    chainId
  }: RequiredChainOptions): Promise<SafeSingletonResponse[]> {
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
    { chainId }: RequiredChainOptions
  ): Promise<OwnerResponse> {
    if (ownerAddress === '') {
      throw new Error('Invalid owner address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/owners/${this.getAddress(ownerAddress, chainId)}/safes/`,
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
    { chainId }: RequiredChainOptions
  ): Promise<ModulesResponse> {
    if (moduleAddress === '') {
      throw new Error('Invalid module address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/modules/${this.getAddress(moduleAddress, chainId)}/safes/`,
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
    { chainId }: RequiredChainOptions
  ): Promise<SafeInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/`,
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
    { chainId }: RequiredChainOptions
  ): Promise<SafeCreationInfoResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/creation/`,
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
    { chainId }: RequiredChainOptions
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/multisig-transactions/estimations/`,
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
    { chainId, ...options }: GetIncomingTransactionsOptions
  ): Promise<TransferListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/incoming-transfers/`
    )
    this.#addUrlQueryParams(url, options)

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
    { chainId, ...options }: GetModuleTransactionsOptions
  ): Promise<SafeModuleTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/module-transactions/`
    )
    this.#addUrlQueryParams(url, options)

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns a multisig transaction as indexed by the Transaction Service, with its execution data
   * (`executionDate`, `blockNumber`, `transactionHash`, `gasUsed`, `fee`...). Unlike `queue.getTransaction`,
   * it also returns the transactions executed on-chain without an off-chain proposal.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @param options - Chain of the request
   * @returns The information of the Safe transaction
   * @throws "Invalid safeTxHash"
   * @throws "Not found."
   */
  async getTransaction(
    safeTxHash: string,
    { chainId }: RequiredChainOptions
  ): Promise<IndexerMultisigTransactionResponse> {
    if (safeTxHash === '') {
      throw new Error('Invalid safeTxHash')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v2/multisig-transactions/${safeTxHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the executed multisig transactions of a Safe as indexed by the Transaction Service, with their execution
   * data and including the ones executed on-chain without an off-chain proposal. The pending transactions are in
   * `queue.getPendingTransactions`.
   *
   * @param safeAddress - The Safe address
   * @param options - Optional parameters to filter or modify the response
   * @returns The history of multisig transactions
   * @throws "Invalid Safe address"
   * @throws "Checksum address validation failed"
   */
  async getMultisigTransactions(
    safeAddress: string,
    { chainId, ...options }: GetMultisigTransactionsOptions
  ): Promise<IndexerMultisigTransactionListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v2/safes/${this.getAddress(safeAddress, chainId)}/multisig-transactions/`
    )
    this.#addUrlQueryParams(url, { ...options, executed: true })

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
    { chainId, ...options }: AllTransactionsOptions
  ): Promise<AllTransactionsListResponse> {
    if (safeAddress === '') {
      throw new Error('Invalid Safe address')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v2/safes/${this.getAddress(safeAddress, chainId)}/all-transactions/`
    )
    this.#addUrlQueryParams(url, options)

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
  }: TokenInfoListOptions): Promise<TokenInfoListResponse> {
    const url = new URL(`${this.#getBaseUrl(chainId)}/v1/tokens/`)
    this.#addUrlQueryParams(url, options)

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
  async getToken(
    tokenAddress: string,
    { chainId }: RequiredChainOptions
  ): Promise<TokenInfoResponse> {
    if (tokenAddress === '') {
      throw new Error('Invalid token address')
    }
    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/tokens/${this.getAddress(tokenAddress, chainId)}/`,
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
    { chainId, ...options }: GetSafeOperationListOptions
  ): Promise<GetSafeOperationListResponse> {
    if (!safeAddress) {
      throw new Error('Safe address must not be empty')
    }
    const url = new URL(
      `${this.#getBaseUrl(chainId)}/v1/safes/${this.getAddress(safeAddress, chainId)}/safe-operations/`
    )
    this.#addUrlQueryParams(url, options)

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
    options: GetPendingSafeOperationListOptions
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
    { chainId }: RequiredChainOptions
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

    // Block timestamps are in seconds; the service expects ISO dates
    const getISOString = (date: number | undefined) =>
      !date ? null : new Date(date * 1000).toISOString()

    const userOperationV06 = userOperation as UserOperationV06

    return this.api({
      url: `${this.#getBaseUrl(chainId)}/v1/safes/${safeAddress}/safe-operations/`,
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
    { chainId, limit, offset }: ListOptions & RequiredChainOptions
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
    { chainId }: RequiredChainOptions
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
