import { BigNumber } from 'ethers'
import { Abi } from '../utils/types'

interface EthAdapter {
  isAddress(address: string): boolean
  getBalance(address: string): Promise<BigNumber>
  getChainId(): Promise<number>
  getContract(address: string, abi: Abi): any
  getContractCode(address: string): Promise<string>
  getSignerAddress(): Promise<string>
  signMessage(message: string, signerAddress: string): Promise<string>
  estimateGas(transaction: any, options?: any): Promise<number>
  call(transaction: any): Promise<string>
}

export default EthAdapter
