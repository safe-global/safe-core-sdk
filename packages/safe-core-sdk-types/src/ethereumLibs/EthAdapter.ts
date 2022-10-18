import { BigNumber } from '@ethersproject/bignumber'
import { SingletonDeployment } from '@gnosis.pm/safe-deployments'
import { AbiItem } from 'web3-utils'
import { CreateCallContract } from '../contracts/CreateCallContract'
import { GnosisSafeContract } from '../contracts/GnosisSafeContract'
import { GnosisSafeProxyFactoryContract } from '../contracts/GnosisSafeProxyFactoryContract'
import { MultiSendCallOnlyContract } from '../contracts/MultiSendCallOnlyContract'
import { MultiSendContract } from '../contracts/MultiSendContract'
import { SignMessageLibContract } from '../contracts/SignMessageLibContract'
import { Eip3770Address, SafeTransactionEIP712Args, SafeVersion } from '../types'

export interface EthAdapterTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
  maxFeePerGas?: number | string
  maxPriorityFeePerGas?: number | string
}

export interface GetContractProps {
  safeVersion: SafeVersion
  chainId: number
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
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): GnosisSafeContract
  getMultiSendContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): MultiSendContract
  getMultiSendCallOnlyContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): MultiSendCallOnlyContract
  getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): GnosisSafeProxyFactoryContract
  getSignMessageLibContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): SignMessageLibContract
  getCreateCallContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): CreateCallContract
  getContractCode(address: string, defaultBlock?: string | number): Promise<string>
  isContractDeployed(address: string, defaultBlock?: string | number): Promise<boolean>
  getStorageAt(address: string, position: string): Promise<string>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string): Promise<string>
  signTypedData(
    safeTransactionEIP712Args: SafeTransactionEIP712Args,
    signTypedDataVersion?: string
  ): Promise<string>
  estimateGas(
    transaction: EthAdapterTransaction,
    callback?: (error: Error, gas: number) => void
  ): Promise<number>
  call(transaction: EthAdapterTransaction, defaultBlock?: string | number): Promise<string>
  encodeParameters(types: string[], values: any[]): string
  decodeParameters(types: any[], values: string): { [key: string]: any }
}
