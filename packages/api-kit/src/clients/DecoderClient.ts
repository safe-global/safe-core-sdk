import { HttpMethod } from '@safe-global/api-kit/utils/httpRequests'
import { ChainOptions } from '@safe-global/api-kit/types/common'
import {
  ContractListResponse,
  DecodeDataResponse,
  DecoderServiceInfoResponse,
  GetContractOptions,
  GetContractsOptions
} from '@safe-global/api-kit/types/decoderServiceTypes'
import { BaseClient } from './BaseClient'

/**
 * Client of the Safe Decoder Service. One method per endpoint of the service.
 */
export class DecoderClient extends BaseClient {
  /**
   * Returns the version of the service.
   *
   * @returns The version of the service
   */
  async getServiceInfo(): Promise<DecoderServiceInfoResponse> {
    return this.api({
      url: `${this.baseUrl}/v1/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Decodes the specified transaction data using the known ABIs.
   *
   * @param data - The transaction data. '0x' prefixed hexadecimal string
   * @param to - The address of the receiving contract, which makes the decoding more accurate
   * @param options - Chain of the receiving contract
   * @returns The decoded data and the accuracy of the decoding
   * @throws "Invalid data"
   * @throws "Cannot find function selector to decode data"
   */
  async decodeData(
    data: string,
    to?: string,
    { chainId }: ChainOptions = {}
  ): Promise<DecodeDataResponse> {
    if (data === '') {
      throw new Error('Invalid data')
    }

    const body: { data: string; to?: string; chainId?: number } = { data }

    if (to) {
      // The service only accepts the chainId together with `to`
      const requestChainId = this.getChainId(chainId, to)
      body.to = this.getAddress(to, requestChainId)
      if (requestChainId !== undefined) {
        body.chainId = Number(requestChainId)
      }
    }

    return this.api({
      url: `${this.baseUrl}/v1/data-decoder`,
      method: HttpMethod.Post,
      body
    })
  }

  /**
   * Returns the paginated list of contracts known by the service.
   *
   * @param options - Optional filters and pagination
   * @returns The list of contracts
   */
  async getContracts(options: GetContractsOptions = {}): Promise<ContractListResponse> {
    const url = new URL(`${this.baseUrl}/v1/contracts`)
    const { chainIds, trustedForDelegateCall, limit, offset } = options

    chainIds?.forEach((chainId) => url.searchParams.append('chain_ids', chainId.toString()))
    this.addQueryParams(url, {
      trusted_for_delegate_call: trustedForDelegateCall,
      limit,
      offset
    })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the contracts known by the service for a given address, one per chain.
   *
   * @param contractAddress - The contract address
   * @param options - Optional chain filter and pagination
   * @returns The list of contracts
   * @throws "Invalid contract address"
   */
  async getContract(
    contractAddress: string,
    options: GetContractOptions = {}
  ): Promise<ContractListResponse> {
    if (contractAddress === '') {
      throw new Error('Invalid contract address')
    }
    const address = this.getAddress(contractAddress)
    const url = new URL(`${this.baseUrl}/v1/contracts/${address}`)
    const { chainIds, limit, offset } = options

    chainIds?.forEach((chainId) => url.searchParams.append('chain_ids', chainId.toString()))
    this.addQueryParams(url, { limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }
}
