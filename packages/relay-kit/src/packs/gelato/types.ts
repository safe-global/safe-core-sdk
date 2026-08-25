import Safe from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  MetaTransactionOptions,
  SafeTransaction
} from '@safe-global/types-kit'

/**
 * @deprecated Will be removed in the next major version. Use `Safe4337Pack` instead.
 */
export type GelatoOptions = {
  apiKey?: string
  protocolKit: Safe
}

/**
 * @deprecated Will be removed in the next major version. Use `Safe4337Pack` instead.
 */
export type GelatoEstimateFeeProps = {
  chainId: bigint
  gasLimit: string
  gasToken?: string
}

/**
 * @deprecated Will be removed in the next major version. Use `Safe4337Pack` instead.
 */
export type GelatoEstimateFeeResult = string

/**
 * @deprecated Will be removed in the next major version. Use `Safe4337Pack` instead.
 */
export type GelatoCreateTransactionProps = {
  transactions: MetaTransactionData[]
  /** options - The transaction array optional properties */
  options?: MetaTransactionOptions
  /** onlyCalls - Forces the execution of the transaction array with MultiSendCallOnly contract */
  onlyCalls?: boolean
}

/**
 * @deprecated Will be removed in the next major version. Use `Safe4337Pack` instead.
 */
export type GelatoExecuteTransactionProps = {
  executable: SafeTransaction
  options?: MetaTransactionOptions
}
