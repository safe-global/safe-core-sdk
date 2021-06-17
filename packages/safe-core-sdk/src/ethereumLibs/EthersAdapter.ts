import { Provider } from '@ethersproject/providers'
import { BigNumber, Signer } from 'ethers'
import { Abi } from '../utils/types'
import EthAdapter from './EthAdapter'

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

  getContract(address: string, abi: Abi): any {
    return new this.#ethers.Contract(address, abi, this.#signer)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
  }

  async getSignerAddress(): Promise<string> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    return this.#signer.getAddress()
  }

  signMessage(message: string): Promise<string> {
    if (!this.#signer) {
      throw new Error('No signer provided')
    }
    const messageArray = this.#ethers.utils.arrayify(message)
    return this.#signer.signMessage(messageArray)
  }

  async estimateGas(transaction: any): Promise<number> {
    return (await this.#provider.estimateGas(transaction)).toNumber()
  }

  call(transaction: any): Promise<string> {
    return this.#provider.call(transaction)
  }
}

export default EthersAdapter
