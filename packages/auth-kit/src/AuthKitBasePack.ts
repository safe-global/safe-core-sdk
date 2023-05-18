import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'

import { getErrorMessage } from './lib/errors'
import type { AuthKitSignInData } from './types'

export abstract class AuthKitBasePack {
  safeAuthData?: AuthKitSignInData

  abstract init(options?: unknown): Promise<void>
  abstract signIn(): Promise<AuthKitSignInData>
  abstract signOut(): Promise<void>
  abstract getProvider(): ethers.providers.ExternalProvider | null
  abstract getUserInfo(): Promise<unknown>
  abstract subscribe(event: unknown, handler: unknown): void
  abstract unsubscribe(event: unknown, handler: unknown): void

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

  async getAddress(): Promise<string> {
    const ethersProvider = new ethers.providers.Web3Provider(this.getProvider())

    const signer = ethersProvider.getSigner()

    const address = await signer.getAddress()

    return address
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
