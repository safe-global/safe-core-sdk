import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
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

const hasEip3770Prefix = (fullAddress: string): boolean => fullAddress.includes(':')

/**
 * Shared plumbing of the service clients: HTTP requests, EIP-3770 addresses and query parameters.
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

  /** Runtime guard for JavaScript callers: the types already require the `chainId` */
  protected requireChainId(chainId?: bigint): bigint {
    if (chainId === undefined) {
      throw new Error('chainId is required')
    }
    return chainId
  }

  /**
   * Validates an address and splits it. An EIP-3770 prefix is only accepted together with the `chainId`
   * of the request, and must match it. Without `chainId` the address must be plain.
   */
  protected getEip3770Address(fullAddress: string, chainId?: bigint): Eip3770Address {
    if (chainId !== undefined) {
      return validateEip3770Address(fullAddress, chainId)
    }
    if (hasEip3770Prefix(fullAddress)) {
      throw new Error(
        'An EIP-3770 address requires chainId. Pass it to the method or remove the prefix'
      )
    }
    validateEthereumAddress(fullAddress)
    return { prefix: '', address: fullAddress }
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
