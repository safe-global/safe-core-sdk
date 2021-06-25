import { Provider } from '@ethersproject/providers'
import { SafeSignature, SafeTransaction, SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import { BigNumber, ContractTransaction, Signer } from 'ethers'
import { ContractNetworksConfig } from './configuration/contracts'

export interface EthersSafeConfig {
  /** ethers - Ethers v5 library */
  ethers: any
  /** safeAddress - The address of the Safe account to use */
  safeAddress: string
  /** providerOrSigner - Ethers provider or signer */
  providerOrSigner?: Provider | Signer
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export interface ConnectEthersSafeConfig {
  /** providerOrSigner - Ethers provider or signer */
  providerOrSigner: Provider | Signer
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: string
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export interface ExecuteTransactionOptions {
  /** gasLimit - Safe transaction gas limit */
  gasLimit: number
  /** gasPrice - Safe transaction gas price */
  gasPrice?: number
}

interface Safe {
  connect({ providerOrSigner, safeAddress, contractNetworks }: ConnectEthersSafeConfig): void
  getProvider(): Provider
  getSigner(): Signer | undefined
  getAddress(): string
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
  createTransaction(...safeTransactions: SafeTransactionDataPartial[]): Promise<SafeTransaction>
  createRejectionTransaction(nonce: number): Promise<SafeTransaction>
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
  executeTransaction(safeTransaction: SafeTransaction, options?: ExecuteTransactionOptions): Promise<ContractTransaction>
}

export default Safe
