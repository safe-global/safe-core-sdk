import { Provider } from '@ethersproject/providers'
import { ContractNetworksConfig } from 'configuration/contracts'
import { BigNumber, ContractTransaction, Signer } from 'ethers'
import { SafeSignature } from './utils/signatures/SafeSignature'
import SafeTransaction, { SafeTransactionDataPartial } from './utils/transactions/SafeTransaction'

export interface EthersSafeConfig {
  ethers: any
  safeAddress: string
  providerOrSigner?: Provider | Signer
  contractNetworks?: ContractNetworksConfig
}

export interface ConnectEthersSafeConfig {
  providerOrSigner: Provider | Signer
  safeAddress?: string
  contractNetworks?: ContractNetworksConfig
}

interface Safe {
  connect({ providerOrSigner, safeAddress, contractNetworks }: ConnectEthersSafeConfig): void
  getProvider(): Provider
  getSigner(): Signer | undefined
  getSafeAddress(): string
  getMultiSendAddress(): string
  getContractVersion(): Promise<string>
  getNonce(): Promise<number>
  getOwners(): Promise<string[]>
  getThreshold(): Promise<number>
  getChainId(): Promise<number>
  getBalance(): Promise<BigNumber>
  getModules(): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  isOwner(ownerAddress: string): Promise<boolean>
  createTransaction(safeTransactions: SafeTransactionDataPartial): Promise<SafeTransaction>
  getTransactionHash(safeTransaction: SafeTransaction): Promise<string>
  signTransactionHash(hash: string): Promise<SafeSignature>
  signTransaction(safeTransaction: SafeTransaction): Promise<void>
  approveTransactionHash(hash: string): Promise<ContractTransaction>
  getOwnersWhoApprovedTx(txHash: string): Promise<string[]>
  getEnableModuleTx(moduleAddress: string): Promise<SafeTransaction>
  getDisableModuleTx(moduleAddress: string): Promise<SafeTransaction>
  getAddOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction>
  getRemoveOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction>
  getSwapOwnerTx(oldOwnerAddress: string, newOwnerAddress: string): Promise<SafeTransaction>
  getChangeThresholdTx(threshold: number): Promise<SafeTransaction>
  executeTransaction(safeTransaction: SafeTransaction): Promise<ContractTransaction>
}

export default Safe
