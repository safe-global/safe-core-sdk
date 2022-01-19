import { BigNumber } from '@ethersproject/bignumber'
import { SafeVersion } from '../contracts/config'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import GnosisSafeProxyFactoryContract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import { AbiItem } from '../types'

export interface EthAdapterTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface GetSafeContractProps {
  safeVersion: SafeVersion
  chainId: number
  isL1SafeMasterCopy?: boolean
  customContractAddress?: string
  customContractAbi?: AbiItem[]
}

export interface GetContractProps {
  safeVersion: SafeVersion
  chainId: number
  customContractAddress?: string
  customContractAbi?: AbiItem[]
}

interface EthAdapter {
  isAddress(address: string): boolean
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getContract(address: string, abi: AbiItem[]): any
  getSafeContract({
    safeVersion,
    chainId,
    isL1SafeMasterCopy,
    customContractAddress,
    customContractAbi
  }: GetSafeContractProps): GnosisSafeContract
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

export default EthAdapter
