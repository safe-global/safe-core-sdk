import { BigNumber } from 'ethers'
import { Abi } from '../utils/types'
import EthAdapter from './EthAdapter'

export interface Web3AdapterConfig {
  /** web3 - Web3 library */
  web3: any
}

class Web3Adapter implements EthAdapter {
  #web3: any

  constructor({ web3 }: Web3AdapterConfig) {
    if (!web3) {
      throw new Error('web3 property missing from options')
    }
    this.#web3 = web3
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

  getContract(address: string, abi: Abi): any {
    return new this.#web3.eth.Contract(abi, address)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#web3.eth.getCode(address)
  }

  async getSignerAddress(): Promise<string> {
    return this.#web3.eth.defaultAccount || (await this.#web3.eth.getAccounts())[0]
  }

  signMessage(message: string, signerAddress: string): Promise<string> {
    return this.#web3.eth.sign(message, signerAddress)
  }
}

export default Web3Adapter
