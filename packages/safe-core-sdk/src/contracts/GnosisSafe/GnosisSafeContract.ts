import { BigNumber } from 'ethers'
import SafeTransaction, { SafeTransactionData } from '../../utils/transactions/SafeTransaction'
import { TransactionResult, TxOptions } from '../../utils/transactions/types'

interface GnosisSafeContract {
  getVersion(): Promise<string>
  getAddress(): string
  getNonce(): Promise<number>
  getThreshold(): Promise<number>
  getOwners(): Promise<string[]>
  isOwner(address: string): Promise<boolean>
  getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string>
  approvedHashes(ownerAddress: string, hash: string): Promise<BigNumber>
  approveHash(hash: string, options?: TxOptions): Promise<TransactionResult>
  getModules(): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  execTransaction(safeTransaction: SafeTransaction, options?: TxOptions): Promise<TransactionResult>
  encode(methodName: string, params: any[]): string
  estimateGas(methodName: string, params: any[], options: TxOptions): Promise<number>
}

export default GnosisSafeContract
