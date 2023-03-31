import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import {
  Web3TransactionOptions,
  Web3TransactionResult
} from '@safe-global/protocol-kit/adapters/web3/types'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export async function toTxResult(
  promiEvent: PromiEvent<TransactionReceipt>,
  options?: Web3TransactionOptions
): Promise<Web3TransactionResult> {
  return new Promise((resolve, reject) =>
    promiEvent
      .once('transactionHash', (hash: string) => resolve({ hash, promiEvent, options }))
      .catch(reject)
  )
}
