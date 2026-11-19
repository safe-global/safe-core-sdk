import { ListResponse } from '@safe-global/types-kit'

export type { ListResponse }

export type ListOptions = {
  /** Maximum number of results to return per page */
  limit?: number
  /** Initial index from which to return the results */
  offset?: number
}

export type ChainOptions = {
  /** Chain of the request. Without it the request covers every chain, and the addresses must have no EIP-3770 prefix */
  chainId?: bigint
}

export type RequiredChainOptions = {
  /** Chain of the request. An EIP-3770 prefix in the addresses must match it */
  chainId: bigint
}
