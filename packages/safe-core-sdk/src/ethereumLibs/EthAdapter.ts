import { BigNumber } from '@ethersproject/bignumber'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import GnosisSafeProxyFactoryContract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import { SafeVersion } from '../contracts/safeDeploymentContracts'
import { AbiItem } from '../types'

export interface EthAdapterTransaction {
  to: string
  from: string
  data: string
  value?: string
  gasPrice?: number
  gasLimit?: number
}

export interface GnosisSafeContracts {
  gnosisSafeContract: GnosisSafeContract
  multiSendContract: MultiSendContract
}

interface EthAdapter {
  isAddress(address: string): boolean
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getContract(address: string, abi: AbiItem[]): any
  getSafeContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeContract>
  getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<MultiSendContract>
  getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeProxyFactoryContract>
  getContractCode(address: string): Promise<string>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string, signerAddress: string): Promise<string>
  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number>
  call(transaction: EthAdapterTransaction): Promise<string>
}

export default EthAdapter
