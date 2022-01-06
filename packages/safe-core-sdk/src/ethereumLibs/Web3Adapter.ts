import Web3 from 'web3'
const namehash = require('@ensdomains/eth-ens-namehash')
import { BigNumber } from '@ethersproject/bignumber'
import { SafeVersion } from '../contracts/config'
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
  getSafeProxyFactoryContractDeployment
} from '../contracts/safeDeploymentContracts'
import { AbiItem } from '../types'
import EthAdapter, { EthAdapterTransaction, GetSafeContractProps } from './EthAdapter'

export interface Web3AdapterConfig {
  /** web3 - Web3 library */
  web3: Web3
  /** signerAddress - Address of the signer */
  signerAddress: string
}

class Web3Adapter implements EthAdapter {
  #web3: Web3
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

  getSafeContract({
    safeVersion,
    chainId,
    isL1SafeMasterCopy,
    customContractAddress
  }: GetSafeContractProps): GnosisSafeContractWeb3 {
    const safeSingletonDeployment = getSafeContractDeployment(
      safeVersion,
      chainId,
      isL1SafeMasterCopy
    )
    const contractAddress =
      customContractAddress ?? safeSingletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy contract address')
    }
    const safeContract = this.getContract(
      contractAddress,
      safeSingletonDeployment?.abi as AbiItem[]
    )
    return getSafeContractInstance(safeVersion, safeContract)
  }

  getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): MultiSendWeb3Contract {
    const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
    const contractAddress = customContractAddress ?? multiSendDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Multi Send contract addresss')
    }
    const multiSendContract = this.getContract(
      contractAddress,
      multiSendDeployment?.abi as AbiItem[]
    )
    return getMultiSendContractInstance(safeVersion, multiSendContract)
  }

  getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): GnosisSafeProxyFactoryWeb3Contract {
    const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
    const contractAddress =
      customContractAddress ?? proxyFactoryDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy Factory contract address')
    }
    const proxyFactoryContract = this.getContract(
      contractAddress,
      proxyFactoryDeployment?.abi as AbiItem[]
    )
    return getGnosisSafeProxyFactoryContractInstance(safeVersion, proxyFactoryContract)
  }

  getContract(address: string, abi: any): any {
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

  estimateGas(transaction: EthAdapterTransaction, options?: any): Promise<number> {
    return this.#web3.eth.estimateGas(transaction, options)
  }

  call(transaction: EthAdapterTransaction): Promise<string> {
    return this.#web3.eth.call(transaction)
  }

  ensLookup(name: string): Promise<string> {
    return this.#web3.eth.ens.getAddress(name)
  }

  async ensReverseLookup(address: string): Promise<string> {
    const lookup = address.toLowerCase().substr(2) + '.addr.reverse'
    const node = namehash.hash(lookup)
    const ResolverContract = await this.#web3.eth.ens.getResolver(lookup);
    return await ResolverContract.methods.name(node).call()
  }
}

export default Web3Adapter
