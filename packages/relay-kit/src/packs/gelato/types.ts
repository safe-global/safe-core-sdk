import Safe from '@safe-global/protocol-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

export type GelatoOptions = {
  apiKey?: string
  protocolKit: Safe
}

export type GelatoEstimateFeeProps = {
  chainId: bigint
  gasLimit: string
  gasToken?: string
}

export type GelatoEstimateFeeResult = string

export type GelatoCreateTransactionProps = {
  transactions: MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: MetaTransactionOptions
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}
