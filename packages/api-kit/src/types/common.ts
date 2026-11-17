import { ListResponse } from '@safe-global/types-kit'

export type { ListResponse }

export type ListOptions = {
  /** Maximum number of results to return per page */
  limit?: number
  /** Initial index from which to return the results */
  offset?: number
}

export type ChainOptions = {
  /** Chain of the request. Defaults to the EIP-3770 prefix of the address */
  chainId?: bigint
}

export type RequiredChainOptions = {
  /** Chain of the request */
  chainId: bigint
}
