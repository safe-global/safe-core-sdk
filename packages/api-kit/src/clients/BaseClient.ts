import { validateEip3770Address, validateEthereumAddress } from '@safe-global/protocol-kit'
import { Eip3770Address } from '@safe-global/types-kit'
import { HttpRequest, sendRequest } from '@safe-global/api-kit/utils/httpRequests'

export type ServiceClientConfig = {
  /** Base URL of the service, without trailing slash */
  baseUrl: string
  /** Chain the kit is bound to */
  chainId: bigint
  /** API key sent as a Bearer token */
  apiKey?: string
}

export type QueryParams = Record<string, string | number | boolean | bigint | undefined>

/**
 * Shared plumbing of the service clients: HTTP requests with the API key, address validation and query parameters.
 */
export abstract class BaseClient {
  protected readonly baseUrl: string
  protected readonly chainId: bigint
  readonly #apiKey?: string

  constructor({ baseUrl, chainId, apiKey }: ServiceClientConfig) {
    this.baseUrl = baseUrl
    this.chainId = chainId
    this.#apiKey = apiKey
  }

  protected async api<T>(request: HttpRequest): Promise<T> {
    return sendRequest(request, this.#apiKey)
  }

  protected isValidAddress(address: string): boolean {
    try {
      validateEthereumAddress(address)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validates an address that may carry an EIP-3770 chain prefix and returns it without the prefix.
   */
  protected getEip3770Address(fullAddress: string): Eip3770Address {
    return validateEip3770Address(fullAddress, this.chainId)
  }

  protected getAddress(fullAddress: string): string {
    return this.getEip3770Address(fullAddress).address
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
