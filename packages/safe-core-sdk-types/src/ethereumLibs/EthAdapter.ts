import { AbiItem } from 'web3-utils'
import { Eip3770Address, SafeEIP712Args, SafeVersion } from '@safe-global/safe-core-sdk-types/types'
import {
  SafeContract_v1_0_0_Contract,
  SafeContract_v1_1_1_Contract,
  SafeContract_v1_2_0_Contract,
  SafeContract_v1_3_0_Contract,
  SafeContract_v1_4_1_Contract
} from '@safe-global/safe-core-sdk-types/contracts/Safe'
import {
  MultiSendCallOnlyContract_v1_3_0_Contract,
  MultiSendCallOnlyContract_v1_4_1_Contract,
  MultiSendContract_v1_1_1_Contract,
  MultiSendContract_v1_3_0_Contract,
  MultiSendContract_v1_4_1_Contract
} from '../contracts/MultiSend'
import {
  CompatibilityFallbackHandlerContract_v1_3_0_Contract,
  CompatibilityFallbackHandlerContract_v1_4_1_Contract
} from '../contracts/CompatibilityFallbackHandler'
import {
  SafeProxyFactoryContract_v1_0_0_Contract,
  SafeProxyFactoryContract_v1_1_1_Contract,
  SafeProxyFactoryContract_v1_3_0_Contract,
  SafeProxyFactoryContract_v1_4_1_Contract
} from '../contracts/SafeProxyFactory'
import {
  SignMessageLibContract_v1_3_0_Contract,
  SignMessageLibContract_v1_4_1_Contract
} from '../contracts/SignMessageLib'
import {
  CreateCallContract_v1_3_0_Contract,
  CreateCallContract_v1_4_1_Contract
} from '../contracts/CreateCall'
import {
  SimulateTxAccessorContract_v1_3_0_Contract,
  SimulateTxAccessorContract_v1_4_1_Contract
} from '../contracts/SimulateTxAccessor'

export interface EthAdapterTransaction {
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
  customContractAbi?: AbiItem | AbiItem[]
  isL1SafeSingleton?: boolean
}

export type SafeContactType =
  | SafeContract_v1_0_0_Contract
  | SafeContract_v1_1_1_Contract
  | SafeContract_v1_2_0_Contract
  | SafeContract_v1_3_0_Contract
  | SafeContract_v1_4_1_Contract

export type MultiSendContractType =
  | MultiSendContract_v1_1_1_Contract
  | MultiSendContract_v1_3_0_Contract
  | MultiSendContract_v1_4_1_Contract

export type MultiSendCallOnlyContractType =
  | MultiSendCallOnlyContract_v1_3_0_Contract
  | MultiSendCallOnlyContract_v1_4_1_Contract

export type CompatibilityFallbackHandlerContractType =
  | CompatibilityFallbackHandlerContract_v1_3_0_Contract
  | CompatibilityFallbackHandlerContract_v1_4_1_Contract

export type SafeProxyFactoryContractType =
  | SafeProxyFactoryContract_v1_0_0_Contract
  | SafeProxyFactoryContract_v1_1_1_Contract
  | SafeProxyFactoryContract_v1_3_0_Contract
  | SafeProxyFactoryContract_v1_4_1_Contract

export type SignMessageLibContractType =
  | SignMessageLibContract_v1_3_0_Contract
  | SignMessageLibContract_v1_4_1_Contract

export type CreateCallContractType =
  | CreateCallContract_v1_3_0_Contract
  | CreateCallContract_v1_4_1_Contract

export type SimulateTxAccessorContractType =
  | SimulateTxAccessorContract_v1_3_0_Contract
  | SimulateTxAccessorContract_v1_4_1_Contract

export interface EthAdapter {
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
  }: GetContractProps): Promise<SafeContactType>
  getMultiSendContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendContractType>
  getMultiSendCallOnlyContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendCallOnlyContractType>
  getCompatibilityFallbackHandlerContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContractType>
  getSafeProxyFactoryContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SafeProxyFactoryContractType>
  getSignMessageLibContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContractType>
  getCreateCallContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContractType>
  getSimulateTxAccessorContract({
    safeVersion,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SimulateTxAccessorContractType>
  getContractCode(address: string, defaultBlock?: string | number): Promise<string>
  isContractDeployed(address: string, defaultBlock?: string | number): Promise<boolean>
  getStorageAt(address: string, position: string): Promise<string>
  // TODO: review all any here
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string | undefined>
  signMessage(message: string): Promise<string>
  signTypedData(safeEIP712Args: SafeEIP712Args, signTypedDataVersion?: string): Promise<string>
  estimateGas(
    transaction: EthAdapterTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<string>
  call(transaction: EthAdapterTransaction, defaultBlock?: string | number): Promise<string>
  encodeParameters(types: string[], values: any[]): string
  decodeParameters(types: any[], values: string): { [key: string]: any }
}
