import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { GnosisSafe__factory } from '../../typechain/src/ethers-v5/v1.3.0/factories/GnosisSafe__factory'
import { MultiSend__factory } from '../../typechain/src/ethers-v5/v1.3.0/factories/MultiSend__factory'
import { ProxyFactory__factory } from '../../typechain/src/ethers-v5/v1.3.0/factories/ProxyFactory__factory'
import GnosisSafeEthersV5Contract from '../contracts/GnosisSafe/GnosisSafeContractEthersV5'
import GnosisSafeProxyFactoryEthersV5Contract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersV5Contract'
import MultiSendEthersV5Contract from '../contracts/MultiSend/MultiSendEthersV5Contract'
import {
  getMultiSendContractDeployment,
  getSafeContractDeployment,
  getSafeProxyFactoryContractDeployment,
  SafeVersion
} from '../contracts/safeDeploymentContracts'
import { AbiItem } from '../types'
import EthAdapter, { EthAdapterTransaction } from './EthAdapter'

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

  async getSafeContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeEthersV5Contract> {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const safeSingletonDeployment = getSafeContractDeployment(safeVersion, chainId)
      console.log({ safeSingletonDeployment })
      contractAddress =
        safeSingletonDeployment?.networkAddresses[chainId] ??
        safeSingletonDeployment?.defaultAddress
      console.log({ contractAddress })
    }
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const safeContract = GnosisSafe__factory.connect(contractAddress, this.#signer)
    return new GnosisSafeEthersV5Contract(safeContract)
  }

  async getMultiSendContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<MultiSendEthersV5Contract> {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const multiSendDeployment = getMultiSendContractDeployment(safeVersion, chainId)
      console.log({ multiSendDeployment })
      contractAddress =
        multiSendDeployment?.networkAddresses[chainId] ?? multiSendDeployment?.defaultAddress
      console.log({ contractAddress })
    }
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Multi Send contract is not deployed in the current network')
    }
    const multiSendContract = MultiSend__factory.connect(contractAddress, this.#signer)
    return new MultiSendEthersV5Contract(multiSendContract)
  }

  async getSafeProxyFactoryContract(
    safeVersion: SafeVersion,
    chainId: number,
    customContractAddress?: string
  ): Promise<GnosisSafeProxyFactoryEthersV5Contract> {
    let contractAddress: string | undefined
    if (customContractAddress) {
      contractAddress = customContractAddress
    } else {
      const proxyFactoryDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
      console.log({ proxyFactoryDeployment })
      contractAddress =
        proxyFactoryDeployment?.networkAddresses[chainId] ?? proxyFactoryDeployment?.defaultAddress
      console.log({ contractAddress })
    }
    if (!contractAddress || (await this.getContractCode(contractAddress)) === '0x') {
      throw new Error('Safe Proxy Factory contract is not deployed in the current network')
    }
    const proxyFactoryContract = ProxyFactory__factory.connect(contractAddress, this.#signer)
    return new GnosisSafeProxyFactoryEthersV5Contract(proxyFactoryContract)
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
}

export default EthersAdapter
