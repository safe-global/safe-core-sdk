import { BigNumber } from '@ethersproject/bignumber'
import {
  getGnosisSafeProxyFactoryContractInstance,
  getMultiSendContractInstance,
  getSafeContractInstance
} from '../contracts/contractInstancesWeb3'
import GnosisSafeContractWeb3 from '../contracts/GnosisSafe/GnosisSafeContractWeb3'
import GnosisSafeProxyFactoryWeb3Contract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryWeb3Contract'
import MultiSendWeb3Contract from '../contracts/MultiSend/MultiSendWeb3Contract'
import {
  getMultiSendContractDeployment,
  getSafeContractDeployment,
  getSafeProxyFactoryContractDeployment,
  SafeVersion
} from '../contracts/safeDeploymentContracts'
import { AbiItem } from '../types'
import EthAdapter, { EthAdapterTransaction } from './EthAdapter'

export interface Web3AdapterConfig {
  /** web3 - Web3 library */
  web3: any
  /** signerAddress - Address of the signer */
  signerAddress: string
}

class Web3Adapter implements EthAdapter {
  #web3: any
  #signerAddress: string

  constructor({ web3, signerAddress }: Web3AdapterConfig) {
    if (!web3) {
      throw new Error('web3 property missing from options')
    }
    this.#web3 = web3
    this.#signerAddress = signerAddress
  }

  isAddress(address: string): boolean {
    return this.#web3.utils.isAddress(address)
  }

  async getBalance(address: string): Promise<BigNumber> {
    return BigNumber.from(await this.#web3.eth.getBalance(address))
  }

  async getChainId(): Promise<number> {
    return this.#web3.eth.getChainId()
  }

  async getSafeContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeContractWeb3> {
    const safeSingletonDeployment = getSafeContractDeployment(safeVersion, chainId)
    const contractAddress =
      customContractAddress ??
      safeSingletonDeployment?.networkAddresses[chainId] ??
      safeSingletonDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const safeContract = this.getContract(
      contractAddress,
      safeSingletonDeployment?.abi as AbiItem[]
    )
    return getSafeContractInstance(safeVersion, safeContract)
  }

  async getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<MultiSendWeb3Contract> {
    const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
    const contractAddress =
      customContractAddress ??
      multiSendDeployment?.networkAddresses[chainId] ??
      multiSendDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Multi Send contract is not deployed in the current network')
    }
    const multiSendContract = this.getContract(
      contractAddress,
      multiSendDeployment?.abi as AbiItem[]
    )
    return getMultiSendContractInstance(safeVersion, multiSendContract)
  }

  async getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeProxyFactoryWeb3Contract> {
    const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
    const contractAddress =
      customContractAddress ??
      proxyFactoryDeployment?.networkAddresses[chainId] ??
      proxyFactoryDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Safe Proxy Factory contract is not deployed in the current network')
    }
    const proxyFactoryContract = this.getContract(
      contractAddress,
      proxyFactoryDeployment?.abi as AbiItem[]
    )
    return getGnosisSafeProxyFactoryContractInstance(safeVersion, proxyFactoryContract)
  }

  getContract(address: string, abi: AbiItem[]): any {
    return new this.#web3.eth.Contract(abi, address)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#web3.eth.getCode(address)
  }

  async getTransaction(transactionHash: string): Promise<any> {
    return this.#web3.eth.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string> {
    return this.#signerAddress
  }

  signMessage(message: string): Promise<string> {
    return this.#web3.eth.sign(message, this.#signerAddress)
  }

  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number> {
    return this.#web3.eth.estimateGas(transaction, options)
  }

  call(transaction: EthAdapterTransaction): Promise<string> {
    return this.#web3.eth.call(transaction)
  }
}

export default Web3Adapter
