import { Provider } from '@ethersproject/providers'
import { BigNumber, Signer } from 'ethers'
import { Abi } from '../utils/types'
import EthAdapter from './EthAdapter'

export interface EthersAdapterConfig {
  /** ethers - Ethers v5 library */
  ethers: any
  /** providerOrSigner - Ethers provider or signer */
  providerOrSigner?: Provider | Signer
}

class EthersAdapter implements EthAdapter {
  #ethers: any
  #provider: Provider
  #signer?: Signer

  constructor({ ethers, providerOrSigner }: EthersAdapterConfig) {
    if (!ethers) {
      throw new Error('ethers property missing from options')
    }
    const currentProviderOrSigner = providerOrSigner || (ethers.getDefaultProvider() as Provider)
    if (Signer.isSigner(currentProviderOrSigner)) {
      if (!currentProviderOrSigner.provider) {
        throw new Error('Signer must be connected to a provider')
      }
      this.#provider = currentProviderOrSigner.provider
      this.#signer = currentProviderOrSigner
    } else {
      this.#provider = currentProviderOrSigner
      this.#signer = undefined
    }
    this.#ethers = ethers
  }

  getProvider(): Provider {
    return this.#provider
  }

  getSigner(): Signer | undefined {
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
    return new this.#ethers.Contract(address, abi, this.#signer || this.#provider)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#provider.getCode(address)
  }

  async getAccount(): Promise<string> {
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
}

export default EthersAdapter
