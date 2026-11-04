import { DataDecoded } from '@safe-global/types-kit'
import { ListOptions, ListResponse } from './common'

export type DecoderServiceInfoResponse = {
  readonly version: string
}

/** Accuracy of the decoding returned by the Safe Decoder Service */
export type DecodingAccuracy = 'FULL_MATCH' | 'PARTIAL_MATCH' | 'ONLY_FUNCTION_MATCH' | 'NO_MATCH'

export type DecodeDataResponse = DataDecoded & {
  readonly accuracy: DecodingAccuracy
}

export type ContractAbi = {
  readonly abiHash: string | null
  readonly abiJson: unknown
  readonly modified: string
}

export type ContractProject = {
  readonly description: string
  readonly logoFile: string
}

export type ContractResponse = {
  readonly address: string
  readonly name: string | null
  readonly displayName: string | null
  readonly chainId: number
  readonly project: ContractProject | null
  readonly abi: ContractAbi | null
  readonly modified: string
  readonly trustedForDelegateCall: boolean
  readonly fetchRetries: number
  readonly logoUrl: string | null
}

export type ContractListResponse = ListResponse<ContractResponse>

export type GetContractsOptions = {
  /** Only the contracts deployed on these chains */
  chainIds?: bigint[]
  trustedForDelegateCall?: boolean
} & ListOptions

export type GetContractOptions = {
  /** Only the contracts deployed on these chains */
  chainIds?: bigint[]
} & ListOptions
