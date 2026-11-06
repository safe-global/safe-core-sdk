import {
  getChainIdFromEip3770NetworkPrefix,
  validateEip3770Address,
  validateEthereumAddress
} from '@safe-global/protocol-kit'
import { Eip3770Address } from '@safe-global/types-kit'
import { HttpRequest, sendRequest } from '@safe-global/api-kit/utils/httpRequests'

export type ServiceClientConfig = {
  /** Base URL of the service, without trailing slash */
  baseUrl: string
  /** Default chain of the requests */
  chainId?: bigint
  /** API key sent as a Bearer token */
  apiKey?: string
}

export type QueryParams = Record<string, string | number | boolean | bigint | undefined>

const getEip3770Prefix = (fullAddress: string): string => {
  const parts = fullAddress.split(':')
  return parts.length > 1 ? parts[0] : ''
}

/**
 * Shared plumbing of the service clients: HTTP requests, chain resolution, EIP-3770 addresses and query parameters.
 */
export abstract class BaseClient {
  protected readonly baseUrl: string
  protected readonly chainId?: bigint
  readonly #apiKey?: string

  constructor({ baseUrl, chainId, apiKey }: ServiceClientConfig) {
    this.baseUrl = baseUrl
    this.chainId = chainId
    this.#apiKey = apiKey
  }

  protected async api<T>(request: HttpRequest): Promise<T> {
    return sendRequest(request, this.#apiKey)
  }

  /**
   * Chain of a request: the `chainId` of the method, then the EIP-3770 prefix of the address, then the default chain.
   */
  protected getChainId(chainId?: bigint, fullAddress?: string): bigint | undefined {
    if (chainId !== undefined) {
      return chainId
    }
    const prefix = fullAddress ? getEip3770Prefix(fullAddress) : ''
    if (prefix) {
      try {
        return getChainIdFromEip3770NetworkPrefix(prefix)
      } catch {
        // unknown prefix, rejected by the address validation
      }
    }
    return this.chainId
  }

  protected requireChainId(chainId?: bigint, fullAddress?: string): bigint {
    const resolvedChainId = this.getChainId(chainId, fullAddress)
    if (resolvedChainId === undefined) {
      throw new Error(
        'chainId is required. Pass it to the method or set a default chainId in the kit'
      )
    }
    return resolvedChainId
  }

  /**
   * Validates an address that may carry an EIP-3770 chain prefix and returns it without the prefix.
   */
  protected getEip3770Address(fullAddress: string, chainId?: bigint): Eip3770Address {
    const currentChainId = this.getChainId(chainId, fullAddress)
    if (currentChainId === undefined) {
      validateEthereumAddress(fullAddress)
      return { prefix: '', address: fullAddress }
    }
    return validateEip3770Address(fullAddress, currentChainId)
  }

  protected getAddress(fullAddress: string, chainId?: bigint): string {
    return this.getEip3770Address(fullAddress, chainId).address
  }

  /**
   * Adds the defined entries of a params object as query parameters, keeping the names as they are.
   */
  protected addQueryParams(url: URL, params: QueryParams): void {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value.toString())
      }
    })
  }
}
