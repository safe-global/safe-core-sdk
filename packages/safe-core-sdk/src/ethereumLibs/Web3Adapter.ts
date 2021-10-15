import { BigNumber } from '@ethersproject/bignumber'
import {
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeSingletonDeployment
} from '@gnosis.pm/safe-deployments'
import { MultiSend } from '../../typechain/src/web3-v1/v1.1.1/multi_send'
import { ProxyFactory } from '../../typechain/src/web3-v1/v1.1.1/proxy_factory'
import { GnosisSafe } from '../../typechain/src/web3-v1/v1.2.0/gnosis_safe'
import GnosisSafeWeb3Contract from '../contracts/GnosisSafe/GnosisSafeWeb3Contract'
import GnosisSafeProxyFactoryWeb3Contract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryWeb3Contract'
import MultiSendWeb3Contract from '../contracts/MultiSend/MultiSendWeb3Contract'
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

  async getSafeContract(chainId: number, customContractAddress?: string): Promise<GnosisSafeWeb3Contract> {
    const safeSingletonDeployment = getSafeSingletonDeployment({
      network: chainId.toString(),
      released: true
    })
    const contractAddress =
      customContractAddress ??
      safeSingletonDeployment?.networkAddresses[chainId] ??
      safeSingletonDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress) === '0x')) {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const safeContract = this.getContract(
      contractAddress,
      safeSingletonDeployment?.abi as AbiItem[]
    ) as GnosisSafe
    return new GnosisSafeWeb3Contract(safeContract)
  }

  async getMultiSendContract(chainId: number, customContractAddress?: string): Promise<MultiSendWeb3Contract> {
    const multiSendDeployment = getMultiSendDeployment({
      network: chainId.toString(),
      released: true
    })
    const contractAddress =
      customContractAddress ??
      multiSendDeployment?.networkAddresses[chainId] ??
      multiSendDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress) === '0x')) {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const multiSendContract = this.getContract(
      contractAddress,
      multiSendDeployment?.abi as AbiItem[]
    ) as MultiSend
    return new MultiSendWeb3Contract(multiSendContract)
  }

  async getGnosisSafeProxyFactoryContract(
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeProxyFactoryWeb3Contract> {
    const proxyFactoryDeployment = getProxyFactoryDeployment({
      network: chainId.toString(),
      released: true
    })
    const contractAddress =
      customContractAddress ??
      proxyFactoryDeployment?.networkAddresses[chainId] ??
      proxyFactoryDeployment?.defaultAddress
    if (!contractAddress || (await this.getContractCode(contractAddress) === '0x')) {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const proxyFactoryContract = this.getContract(
      contractAddress,
      proxyFactoryDeployment?.abi as AbiItem[]
    ) as ProxyFactory
    return new GnosisSafeProxyFactoryWeb3Contract(proxyFactoryContract)
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
