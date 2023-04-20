import { BigNumber } from '@ethersproject/bignumber'
import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types/contracts/CompatibilityFallbackHandlerContract'
import { CreateCallContract } from '@safe-global/safe-core-sdk-types/contracts/CreateCallContract'
import { GnosisSafeContract } from '@safe-global/safe-core-sdk-types/contracts/GnosisSafeContract'
import { GnosisSafeProxyFactoryContract } from '@safe-global/safe-core-sdk-types/contracts/GnosisSafeProxyFactoryContract'
import { MultiSendCallOnlyContract } from '@safe-global/safe-core-sdk-types/contracts/MultiSendCallOnlyContract'
import { MultiSendContract } from '@safe-global/safe-core-sdk-types/contracts/MultiSendContract'
import { SignMessageLibContract } from '@safe-global/safe-core-sdk-types/contracts/SignMessageLibContract'
import {
  Eip3770Address,
  SafeTransactionEIP712Args,
  SafeVersion
} from '@safe-global/safe-core-sdk-types/types'
import { SingletonDeployment } from '@safe-global/safe-deployments'
import { AbiItem } from 'web3-utils'

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
  singletonDeployment?: SingletonDeployment
  customContractAddress?: string
  customContractAbi?: AbiItem | AbiItem[]
}

export interface EthAdapter {
  isAddress(address: string): boolean
  getEip3770Address(fullAddress: string): Promise<Eip3770Address>
  getBalance(address: string, defaultBlock?: string | number): Promise<BigNumber>
  getNonce(address: string, defaultBlock?: string | number): Promise<number>
  getChainId(): Promise<number>
  getChecksummedAddress(address: string): string
  getSafeContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<GnosisSafeContract>
  getMultiSendContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendContract>
  getMultiSendCallOnlyContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<MultiSendCallOnlyContract>
  getCompatibilityFallbackHandlerContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CompatibilityFallbackHandlerContract>
  getSafeProxyFactoryContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<GnosisSafeProxyFactoryContract>
  getSignMessageLibContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<SignMessageLibContract>
  getCreateCallContract({
    safeVersion,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): Promise<CreateCallContract>
  getContractCode(address: string, defaultBlock?: string | number): Promise<string>
  isContractDeployed(address: string, defaultBlock?: string | number): Promise<boolean>
  getStorageAt(address: string, position: string): Promise<string>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string | undefined>
  signMessage(message: string): Promise<string>
  signTypedData(
    safeTransactionEIP712Args: SafeTransactionEIP712Args,
    signTypedDataVersion?: string
  ): Promise<string>
  estimateGas(
    transaction: EthAdapterTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<string>
  call(transaction: EthAdapterTransaction, defaultBlock?: string | number): Promise<string>
  encodeParameters(types: string[], values: any[]): string
  decodeParameters(types: any[], values: string): { [key: string]: any }
}
