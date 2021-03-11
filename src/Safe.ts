import { BigNumber } from 'ethers'
import { SafeSignature } from 'utils/signatures'
import { SafeTransaction } from './utils/transactions'

interface Safe {
  getAddress(): string
  getContractVersion(): Promise<string>
  getOwners(): Promise<string[]>
  getThreshold(): Promise<BigNumber>
  getNetworkId(): Promise<number>
  getBalance(): Promise<BigNumber>
  getModules(): Promise<string[]>
  getTransactionHash(transaction: SafeTransaction): Promise<string>
  signMessage(hash: string): Promise<SafeSignature>
  confirmTransaction(transaction: SafeTransaction): Promise<void>
  encodeTransaction(transaction: SafeTransaction): Promise<string>
  executeTransaction(transaction: SafeTransaction, options?: any): Promise<any>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
}

export default Safe
