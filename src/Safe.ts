import { BigNumber } from 'ethers'
import { SafeSignature } from 'utils/signatures'
import { SafeTransaction } from './utils/transactions'

interface Safe {
  address(): string
  getOwners(): Promise<string[]>
  getThreshold(): Promise<BigNumber>
  signMessage(hash: string): Promise<SafeSignature>
  getTransactionHash(transaction: SafeTransaction): Promise<string>
  confirmTransaction(transaction: SafeTransaction): Promise<void>
  encodeTransaction(transaction: SafeTransaction): Promise<string>
  executeTransaction(transaction: SafeTransaction, options?: any): Promise<any>
}

export default Safe
