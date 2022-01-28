import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'
import { EthAdapter, EthAdapterTransaction, GetContractProps } from '@gnosis.pm/safe-core-sdk-types'
import { ethers } from 'ethers'
import {
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance
} from './contracts/contractInstancesEthers'
import GnosisSafeContractEthers from './contracts/GnosisSafe/GnosisSafeContractEthers'
import GnosisSafeProxyFactoryEthersContract from './contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersContract'
import MultiSendEthersContract from './contracts/MultiSend/MultiSendEthersContract'

type Ethers = typeof ethers

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: Ethers
  /** signer - Ethers signer */
  signer: Signer
}

class EthersAdapter implements EthAdapter {
  #ethers: Ethers
  #signer: Signer
  #provider: Provider

  constructor({ ethers, signer }: EthersAdapterConfig) {
    if (!ethers) {
      throw new Error('ethers property missing from options')
    }
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#provider = signer.provider
    this.#ethers = ethers
  }

  getProvider(): Provider {
    return this.#provider
  }

  getSigner(): Signer {
    return this.#signer
  }

  isAddress(address: string): boolean {
    return this.#ethers.utils.isAddress(address)
  }

  async getBalance(address: string): Promise<BigNumber> {
    return BigNumber.from(await this.#provider.getBalance(address))
  }

  async getChainId(): Promise<number> {
    return (await this.#provider.getNetwork()).chainId
  }

  getSafeContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): GnosisSafeContractEthers {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy contract address')
    }
    return getSafeContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getMultiSendContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): MultiSendEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Multi Send contract address')
    }
    return getMultiSendContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getSafeProxyFactoryContract({
    safeVersion,
    chainId,
    singletonDeployment,
    customContractAddress
  }: GetContractProps): GnosisSafeProxyFactoryEthersContract {
    const contractAddress = customContractAddress
      ? customContractAddress
      : singletonDeployment?.networkAddresses[chainId]
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy Factory contract address')
    }
    return getSafeProxyFactoryContractInstance(safeVersion, contractAddress, this.#signer)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
  }

  async isContractDeployed(address: string): Promise<boolean> {
    const contractCode = await this.#provider.getCode(address)
    return contractCode !== '0x'
  }

  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    return this.#provider.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string> {
    return this.#signer.getAddress()
  }

  signMessage(message: string): Promise<string> {
    const messageArray = this.#ethers.utils.arrayify(message)
    return this.#signer.signMessage(messageArray)
  }

  async estimateGas(transaction: EthAdapterTransaction): Promise<number> {
    return (await this.#provider.estimateGas(transaction)).toNumber()
  }

  call(transaction: EthAdapterTransaction): Promise<string> {
    return this.#provider.call(transaction)
  }
}

export default EthersAdapter
