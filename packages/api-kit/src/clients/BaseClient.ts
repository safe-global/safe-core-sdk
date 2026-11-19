import {
  getChainIdFromEip3770NetworkPrefix,
  validateEip3770Address,
  validateEthereumAddress
} from '@safe-global/protocol-kit'
import { Eip3770Address } from '@safe-global/types-kit'
import { HttpRequest, sendRequest } from '@safe-global/api-kit/utils/httpRequests'
import { isSafeHostedUrl } from '@safe-global/api-kit/utils/config'

export type ServiceClientConfig = {
  /** Base URL of the service, without trailing slash */
  baseUrl: string
  /** API key of the Safe hosted services, sent as a Bearer token only to them */
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
  protected readonly apiKey?: string

  constructor({ baseUrl, apiKey }: ServiceClientConfig) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /** Sends the request. The `apiKey` is only attached to the Safe hosted services, never to a custom URL */
  protected async api<T>(request: HttpRequest): Promise<T> {
    return sendRequest(request, isSafeHostedUrl(request.url) ? this.apiKey : undefined)
  }

  /** Chain of a request: the `chainId` of the method, then the EIP-3770 prefix of the address */
  protected getChainId(chainId?: bigint, fullAddress?: string): bigint | undefined {
    if (chainId !== undefined) {
      return chainId
    }
    const prefix = fullAddress ? getEip3770Prefix(fullAddress) : ''
    if (prefix) {
      try {
        return getChainIdFromEip3770NetworkPrefix(prefix)
      } catch {
        // Unknown prefix: the address validation rejects it later
      }
    }
    return undefined
  }

  protected requireChainId(chainId?: bigint, fullAddress?: string): bigint {
    const resolvedChainId = this.getChainId(chainId, fullAddress)
    if (resolvedChainId === undefined) {
      throw new Error(
        'chainId is required. Pass it to the method or use an EIP-3770 address (e.g. sep:0x...)'
      )
    }
    return resolvedChainId
  }

  /** Validates an address, plain or with an EIP-3770 prefix that must match the chain, and splits it */
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

  /** Adds the defined params as query parameters, keeping their names */
  protected addQueryParams(url: URL, params: QueryParams): void {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value.toString())
      }
    })
  }
}
