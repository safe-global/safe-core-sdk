import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'

import type { AuthKitSignInData } from './types'

export abstract class AuthKitBasePack {
  safeAuthData?: AuthKitSignInData

  /**
   * Initialize the pack
   * @param options The provider specific options
   */
  abstract init(options?: unknown): Promise<void>

  /**
   * Start the sign in flow in the pack
   * @returns The sign in data from the provider
   */
  abstract signIn(): Promise<AuthKitSignInData>

  /**
   * Start the sign out flow in the pack
   */
  abstract signOut(): Promise<void>

  /**
   * Get the provider instance based on the pack
   * @returns The provider instance
   */
  abstract getProvider(): ethers.providers.ExternalProvider | null

  /**
   * Get the user info from the provider
   * @returns The user info from the provider
   */
  abstract getUserInfo(): Promise<unknown>

  /**
   * Subscribe to an event
   * @param event  The event to subscribe to
   * @param handler  The handler to be called when the event is triggered
   */
  abstract subscribe(event: unknown, handler: unknown): void

  /**
   * Unsubscribe from an event
   * @param event  The event to unsubscribe from
   * @param handler The handler to be removed from the event
   */
  abstract unsubscribe(event: unknown, handler: unknown): void

  /**
   * Get the list of Safe addresses owned by the user in the chain
   * @param txServiceUrl The URL of the Safe Transaction Service
   * @returns The list of Safe addresses owned by the user in the chain
   */
  async getSafes(txServiceUrl: string): Promise<string[]> {
    const apiKit = this.#getApiKit(txServiceUrl)

    const address = await this.getAddress()

    try {
      const safesByOwner = await apiKit.getSafesByOwner(address)

      return safesByOwner.safes
    } catch (e) {
      return []
    }
  }

  /**
   * Get the owner address from the provider
   * @returns The signer address
   */
  async getAddress(): Promise<string> {
    if (!this.getProvider()) {
      throw new Error('Provider is not defined')
    }

    const ethersProvider = new ethers.providers.Web3Provider(
      this.getProvider() as ethers.providers.ExternalProvider
    )

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

    const provider = new ethers.providers.Web3Provider(
      this.getProvider() as ethers.providers.ExternalProvider
    )
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
