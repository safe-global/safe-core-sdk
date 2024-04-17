import { JsonFragment } from 'ethers'
import { Eip3770Address, SafeEIP712Args, SafeVersion } from '@safe-global/safe-core-sdk-types/types'

import {
  CompatibilityFallbackHandlerContractImplementationType,
  CreateCallContractImplementationType,
  MultiSendCallOnlyContractImplementationType,
  MultiSendContractImplementationType,
  SafeContractImplementationType,
  SafeProxyFactoryContractImplementationType,
  SignMessageLibContractImplementationType,
  SimulateTxAccessorContractImplementationType
} from '../types'

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface Eip1193Provider {
  request: (args: RequestArguments) => Promise<unknown>
}

export interface SafeProviderTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number | string
  gasLimit?: number | string
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export interface GetContractProps {
  safeVersion: SafeVersion
  customContractAddress?: string
  customContractAbi?: JsonFragment | JsonFragment[]
  isL1SafeSingleton?: boolean
}

export interface ISafeProvider {
  isAddress(address: string): boolean
  getEip3770Address(fullAddress: string): Promise<Eip3770Address>
  getBalance(address: string, defaultBlock?: string | number): Promise<bigint>
  getNonce(address: string, defaultBlock?: string | number): Promise<number>
  getChainId(): Promise<bigint>
  getChecksummedAddress(address: string): string
  getSafeContract({
    safeVersion,
    customContractAddress,
    customContractAbi,
    isL1SafeSingleton
  }: GetContractProps): Promise<SafeContractImplementationType>
  getMultiSendContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendContractImplementationType>
  getMultiSendCallOnlyContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendCallOnlyContractImplementationType>
  getCompatibilityFallbackHandlerContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContractImplementationType>
  getSafeProxyFactoryContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SafeProxyFactoryContractImplementationType>
  getSignMessageLibContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContractImplementationType>
  getCreateCallContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContractImplementationType>
  getSimulateTxAccessorContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SimulateTxAccessorContractImplementationType>
  getContractCode(address: string, defaultBlock?: string | number): Promise<string>
  isContractDeployed(address: string, defaultBlock?: string | number): Promise<boolean>
  getStorageAt(address: string, position: string): Promise<string>
  // TODO: review all any here
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string | undefined>
  signMessage(message: string): Promise<string>
  signTypedData(safeEIP712Args: SafeEIP712Args, signTypedDataVersion?: string): Promise<string>
  estimateGas(
    transaction: SafeProviderTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<string>
  call(transaction: SafeProviderTransaction, defaultBlock?: string | number): Promise<string>
  encodeParameters(types: string[], values: any[]): string
  decodeParameters(types: any[], values: string): { [key: string]: any }
}
