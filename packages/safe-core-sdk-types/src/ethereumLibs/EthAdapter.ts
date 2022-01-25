import { BigNumber } from '@ethersproject/bignumber'
import { SingletonDeployment } from '@gnosis.pm/safe-deployments'
import { GnosisSafeContract } from '../contracts/GnosisSafeContract'
import { GnosisSafeProxyFactoryContract } from '../contracts/GnosisSafeProxyFactoryContract'
import { MultiSendContract } from '../contracts/MultiSendContract'
import { AbiItem, SafeVersion } from '../types'

export interface EthAdapterTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface GetContractProps {
  safeVersion: SafeVersion
  chainId: number
  customContractAddress?: string
  customContractAbi?: AbiItem[]
  singletonDeployment?: SingletonDeployment
}

export interface EthAdapter {
  isAddress(address: string): boolean
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getContract(address: string, abi: AbiItem[]): any
  getSafeContract({
    safeVersion,
    chainId,
    customContractAddress,
    customContractAbi,
    singletonDeployment
  }: GetContractProps): GnosisSafeContract
  getMultiSendContract({
    safeVersion,
    chainId,
    customContractAddress,
    customContractAbi
  }: GetContractProps): MultiSendContract
  getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    customContractAddress,
    customContractAbi
  }: GetContractProps): GnosisSafeProxyFactoryContract
  getContractCode(address: string): Promise<string>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string, signerAddress: string): Promise<string>
  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number>
  call(transaction: EthAdapterTransaction): Promise<string>
}
