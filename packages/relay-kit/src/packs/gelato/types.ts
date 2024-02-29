import Safe from '@safe-global/protocol-kit'
import { MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

export type GelatoOptions = {
  apiKey?: string
  protocolKit: Safe
}

export type GelatoEstimateFeeOptions = {
  chainId: bigint
  gasLimit: string
  gasToken?: string
}

export type GelatoEstimateFeeOptionsResult = string

export type GelatoCreateTransactionOptions = {
  /** options - The transaction array optional properties */
  options?: MetaTransactionOptions
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}
