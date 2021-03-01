import { SafeTransaction, SafeTransactionData } from './utils/transactions'

interface Safe {
  address(): string
  getTransactionHash(transaction: any): Promise<string>
  encodeTransaction(transaction: SafeTransactionData, signatures: string): Promise<string>
  confirmTransaction(transaction: SafeTransaction): Promise<SafeTransaction>
  executeTransaction(transaction: SafeTransactionData, signatures: string): Promise<string>
}

export default Safe
