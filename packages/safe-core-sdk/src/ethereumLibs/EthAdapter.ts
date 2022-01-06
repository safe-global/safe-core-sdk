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
    customContractAddress
  }: GetSafeContractProps): GnosisSafeContract
  getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): MultiSendContract
  getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): GnosisSafeProxyFactoryContract
  getContractCode(address: string): Promise<string>
  getTransaction(transactionHash: string): Promise<any>
  getSignerAddress(): Promise<string>
  signMessage(message: string, signerAddress: string): Promise<string>
  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number>
  call(transaction: EthAdapterTransaction): Promise<string>
  ensLookup(name: string): Promise<string | null>
  ensReverseLookup(address: string): Promise<string | null>
}

export default EthAdapter
