import { HttpMethod } from '@safe-global/api-kit/utils/httpRequests'
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
      url: `${this.baseUrl}/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Decodes the specified transaction data using the known ABIs.
   *
   * @param data - The transaction data. '0x' prefixed hexadecimal string
   * @param to - The address of the receiving contract. When provided, the ABI of the contract on the chain of the kit is used, which makes the decoding more accurate
   * @returns The decoded data and the accuracy of the decoding
   * @throws "Invalid data"
   * @throws "Cannot find function selector to decode data"
   */
  async decodeData(data: string, to?: string): Promise<DecodeDataResponse> {
    if (data === '') {
      throw new Error('Invalid data')
    }

    const body: { data: string; to?: string; chainId?: number } = { data }

    if (to) {
      body.to = this.getAddress(to)
      // The chainId is only accepted by the service when the receiving contract is known
      body.chainId = Number(this.chainId)
    }

    return this.api({
      url: `${this.baseUrl}/data-decoder`,
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
    const url = new URL(`${this.baseUrl}/contracts`)
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
    const url = new URL(`${this.baseUrl}/contracts/${address}`)
    const { chainIds, limit, offset } = options

    chainIds?.forEach((chainId) => url.searchParams.append('chain_ids', chainId.toString()))
    this.addQueryParams(url, { limit, offset })

    return this.api({
      url: url.toString(),
      method: HttpMethod.Get
    })
  }
}
