import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import GnosisSafeEthersV5Contract from '../contracts/GnosisSafe/GnosisSafeEthersV5Contract'
import GnosisSafeProxyFactoryEthersV5Contract from '../contracts/GnosisSafeProxyFactory/GnosisSafeProxyFactoryEthersV5Contract'
import MultiSendEthersV5Contract from '../contracts/MultiSend/MultiSendEthersV5Contract'
import { AbiItem } from '../types'
import { GnosisSafeProxyFactory__factory } from '../types/typechain/ethers-v5/factories/GnosisSafeProxyFactory__factory'
import { GnosisSafe__factory } from '../types/typechain/ethers-v5/factories/GnosisSafe__factory'
import { MultiSend__factory } from '../types/typechain/ethers-v5/factories/MultiSend__factory'
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

  async getSafeContract(safeAddress: string): Promise<GnosisSafeEthersV5Contract> {
    const safeContractCode = await this.getContractCode(safeAddress)
    if (safeContractCode === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const safeContract = GnosisSafe__factory.connect(safeAddress, this.#signer)
    const wrapperSafeContract = new GnosisSafeEthersV5Contract(safeContract)
    return wrapperSafeContract
  }

  async getMultiSendContract(multiSendAddress: string): Promise<MultiSendEthersV5Contract> {
    const multiSendContractCode = await this.getContractCode(multiSendAddress)
    if (multiSendContractCode === '0x') {
      throw new Error('MultiSend contract is not deployed in the current network')
    }
    const multiSendContract = MultiSend__factory.connect(multiSendAddress, this.#signer)
    const wrappedMultiSendContract = new MultiSendEthersV5Contract(multiSendContract)
    return wrappedMultiSendContract
  }

  async getGnosisSafeProxyFactoryContract(
    proxyFactoryAddress: string
  ): Promise<GnosisSafeProxyFactoryEthersV5Contract> {
    const proxyFactoryContractCode = await this.getContractCode(proxyFactoryAddress)
    if (proxyFactoryContractCode === '0x') {
      throw new Error('Safe Proxy Factory contract is not deployed in the current network')
    }
    const proxyFactoryContract = GnosisSafeProxyFactory__factory.connect(
      proxyFactoryAddress,
      this.#signer
    )
    const wrappedProxyFactoryContract = new GnosisSafeProxyFactoryEthersV5Contract(
      proxyFactoryContract
    )
    return wrappedProxyFactoryContract
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
