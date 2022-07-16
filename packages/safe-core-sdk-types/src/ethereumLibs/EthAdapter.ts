import { BigNumber } from '@ethersproject/bignumber'
import { SingletonDeployment } from '@gnosis.pm/safe-deployments'
import { AbiItem } from 'web3-utils'
import { GnosisSafeContract } from '../contracts/GnosisSafeContract'
import { GnosisSafeProxyFactoryContract } from '../contracts/GnosisSafeProxyFactoryContract'
import { MultiSendContract } from '../contracts/MultiSendContract'
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
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
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
  getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress,
    customContractAbi
  }: GetContractProps): GnosisSafeProxyFactoryContract
  getContractCode(address: string): Promise<string>
  isContractDeployed(address: string): Promise<boolean>
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
  call(transaction: EthAdapterTransaction): Promise<string>
}
