import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'

import type { AuthKitEthereumProvider, AuthKitSignInData } from './types'

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
  abstract getProvider(): AuthKitEthereumProvider | null

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
  async getSafes(chainId: number, txServiceUrl?: string): Promise<string[]> {
    const apiKit = this.#getApiKit(chainId, txServiceUrl)

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
    const authKitProvider = this.getProvider()

    if (!authKitProvider) {
      throw new Error('Provider is not defined')
    }

    const ethersProvider = new ethers.BrowserProvider(authKitProvider)

    const signer = await ethersProvider.getSigner()

    return signer.getAddress()
  }

  async getChainId(): Promise<number> {
    const authKitProvider = this.getProvider()

    if (!authKitProvider) {
      throw new Error('Provider is not defined')
    }

    const ethersProvider = new ethers.BrowserProvider(authKitProvider)

    const networkDetails = await ethersProvider.getNetwork()

    return Number(networkDetails.chainId)
  }

  /**
   * Get the SafeApiKit instance
   * @returns A SafeApiKit instance
   */
  #getApiKit(chainId: number, txServiceUrl?: string): SafeApiKit {
    if (!this.getProvider()) {
      throw new Error('Provider is not defined')
    }

    return new SafeApiKit({
      chainId,
      txServiceUrl
    })
  }
}
