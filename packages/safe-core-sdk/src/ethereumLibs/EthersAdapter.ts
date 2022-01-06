import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { SafeVersion } from '../contracts/config'
import {
  getMultiSendContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance
} from '../contracts/contractInstancesEthers'
import GnosisSafeContractEthers from '../contracts/GnosisSafe/GnosisSafeContractEthers'
import GnosisSafeProxyFactoryEthersContract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersContract'
import MultiSendEthersContract from '../contracts/MultiSend/MultiSendEthersContract'
import {
  getMultiSendContractDeployment,
  getSafeContractDeployment,
  getSafeProxyFactoryContractDeployment
} from '../contracts/safeDeploymentContracts'
import { AbiItem } from '../types'
import EthAdapter, { EthAdapterTransaction, GetSafeContractProps } from './EthAdapter'

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: any
  /** signer - Ethers signer */
  signer: Signer
}

class EthersAdapter implements EthAdapter {
  #ethers: any
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
    isL1SafeMasterCopy,
    customContractAddress
  }: GetSafeContractProps): GnosisSafeContractEthers {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const safeSingletonDeployment = getSafeContractDeployment(
        safeVersion,
        chainId,
        isL1SafeMasterCopy
      )
      contractAddress = safeSingletonDeployment?.networkAddresses[chainId]
    }
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy contract address')
    }
    return getSafeContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): MultiSendEthersContract {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
      contractAddress = multiSendDeployment?.networkAddresses[chainId]
    }
    if (!contractAddress) {
      throw new Error('Invalid Multi Send contract address')
    }
    return getMultiSendContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): GnosisSafeProxyFactoryEthersContract {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
      contractAddress = proxyFactoryDeployment?.networkAddresses[chainId]
    }
    if (!contractAddress) {
      throw new Error('Invalid Safe Proxy Factory contract address')
    }
    return getSafeProxyFactoryContractInstance(safeVersion, contractAddress, this.#signer)
  }

  getContract(address: string, abi: AbiItem[]): Contract {
    return new this.#ethers.Contract(address, abi, this.#signer)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
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

  ensLookup(name: string): Promise<string | null> {
    return this.#provider.resolveName(name)
  }

  async ensReverseLookup(address: string): Promise<string | null> {
    return await this.#provider.lookupAddress(address);
  }
}

export default EthersAdapter
