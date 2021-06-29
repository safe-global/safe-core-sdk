import { BigNumber } from 'ethers'
import { ContractNetworkConfig } from '../configuration/contracts'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import { Abi } from '../utils/types'

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
  getSafeContracts(
    safeAddress: string,
    contracts: ContractNetworkConfig
  ): Promise<GnosisSafeContracts>
  getContract(address: string, abi: Abi): any
  getContractCode(address: string): Promise<string>
  getSignerAddress(): Promise<string>
  signMessage(message: string, signerAddress: string): Promise<string>
  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number>
  call(transaction: EthAdapterTransaction): Promise<string>
}

export default EthAdapter
