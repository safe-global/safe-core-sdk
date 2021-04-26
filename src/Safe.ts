import { Provider } from '@ethersproject/providers'
import { BigNumber, ContractTransaction, Signer } from 'ethers'
import { SafeSignature } from './utils/signatures/SafeSignature'
import SafeTransaction, { SafeTransactionDataPartial } from './utils/transactions/SafeTransaction'

interface Safe {
  connect(providerOrSigner: Provider | Signer, safeAddress?: string): void
  getProvider(): Provider
  getSigner(): Signer | undefined
  getAddress(): string
  getContractVersion(): Promise<string>
  getOwners(): Promise<string[]>
  getNonce(): Promise<number>
  getThreshold(): Promise<BigNumber>
  getChainId(): Promise<number>
  getBalance(): Promise<BigNumber>
  getModules(): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  createTransaction(safeTransaction: SafeTransactionDataPartial): Promise<SafeTransaction>
  getTransactionHash(safeTransaction: SafeTransaction): Promise<string>
  signTransactionHash(hash: string): Promise<SafeSignature>
  signTransaction(safeTransaction: SafeTransaction): Promise<void>
  approveTransactionHash(hash: string): Promise<ContractTransaction>
  getOwnersWhoApprovedTx(txHash: string): Promise<string[]>
  executeTransaction(safeTransaction: SafeTransaction, options?: any): Promise<ContractTransaction>
}

export default Safe
