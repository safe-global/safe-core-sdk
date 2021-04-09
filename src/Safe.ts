import { Provider } from '@ethersproject/providers'
import { BigNumber, ContractTransaction, Wallet } from 'ethers'
import { ContractCallParams } from './managers/types'
import { SafeSignature } from './utils/signatures/SafeSignature'
import { SafeTransaction } from './utils/transactions'

interface Safe {
  connect(providerOrSigner: Provider | Wallet, safeAddress?: string): void
  getProvider(): Provider
  getSigner(): Wallet | undefined
  getAddress(): string
  getContractVersion(): Promise<string>
  getOwners(): Promise<string[]>
  getThreshold(): Promise<number>
  getChainId(): Promise<number>
  getBalance(): Promise<BigNumber>
  getModules(): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  isOwner(ownerAddress: string): Promise<boolean>
  getTransactionHash(safeTransaction: SafeTransaction): Promise<string>
  signTransactionHash(hash: string): Promise<SafeSignature>
  signTransaction(safeTransaction: SafeTransaction): Promise<void>
  approveTransactionHash(hash: string, skipOnChainApproval: boolean): Promise<SafeSignature>
  getOwnersWhoApprovedTx(txHash: string): Promise<string[]>
  executeTransaction(safeTransaction: SafeTransaction, options?: any): Promise<ContractTransaction>
  buildContractCall(params: ContractCallParams): Promise<SafeTransaction>
}

export default Safe
