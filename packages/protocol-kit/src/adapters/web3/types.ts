import { BaseTransactionResult } from '@safe-global/safe-core-sdk-types'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'

export interface Web3TransactionOptions {
  from?: string
  gas?: number | string
  gasPrice?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
  nonce?: number
}

export interface Web3TransactionResult extends BaseTransactionResult {
  promiEvent: PromiEvent<TransactionReceipt>
  options?: Web3TransactionOptions
}

/**
 * Removes `readonly` modifier from all properties in T recursively.
 *
 * @template T - The type to make writable.
 */
export type DeepWriteable<T> = T extends object & NotFunction<T>
  ? { -readonly [K in keyof T]: DeepWriteable<T[K]> }
  : T

type Not<T, U> = T extends U ? never : T
type NotFunction<T> = Not<T, (...args: any) => any>
