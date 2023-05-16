import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'

import { getErrorMessage } from './lib/errors'
import { SafeAuthSignInData } from './types'

export abstract class AuthBasePack<
  TConfig,
  TInitOptions,
  TUserInfoResponse,
  TEvent,
  TEventHandler
> {
  config?: TConfig
  safeAuthData?: SafeAuthSignInData

  constructor(config?: TConfig) {
    this.config = config
  }

  abstract init(options?: TInitOptions): Promise<void>
  abstract signIn(): Promise<SafeAuthSignInData>
  abstract signOut(): Promise<void>
  abstract getProvider(): ethers.providers.ExternalProvider
  abstract getUserInfo(): Promise<TUserInfoResponse>
  abstract subscribe(event: TEvent, handler: TEventHandler): void
  abstract unsubscribe(event: TEvent, handler: TEventHandler): void

  async getAddress(): Promise<string> {
    const ethersProvider = new ethers.providers.Web3Provider(this.getProvider())

    const signer = ethersProvider.getSigner()

    const address = await signer.getAddress()

    return address
  }

  async getSafes(txServiceUrl: string): Promise<string[]> {
    const apiKit = this.#getApiKit(txServiceUrl)

    const address = await this.getAddress()

    try {
      const safesByOwner = await apiKit.getSafesByOwner(address)
      return safesByOwner.safes
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Get the SafeApiKit instance
   * @returns A SafeApiKit instance
   */
  #getApiKit(txServiceUrl: string): SafeApiKit {
    if (!this.getProvider()) {
      throw new Error('Provider is not defined')
    }

    const provider = new ethers.providers.Web3Provider(this.getProvider())
    const safeOwner = provider.getSigner(0)

    const adapter = new EthersAdapter({
      ethers,
      signerOrProvider: safeOwner
    })

    return new SafeApiKit({
      txServiceUrl,
      ethAdapter: adapter
    })
  }
}
