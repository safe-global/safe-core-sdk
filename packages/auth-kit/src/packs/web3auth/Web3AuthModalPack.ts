import { ExternalProvider } from '@ethersproject/providers'
import Torus, { TorusParams, UserInfo } from '@web3auth/ws-embed'

import { getErrorMessage } from '@safe-global/auth-kit/lib/errors'
import { Web3AuthConfig, Web3AuthEvent, Web3AuthEventListener } from './types'
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack'
import type { AuthKitSignInData } from '@safe-global/auth-kit/types'

/**
 * Web3AuthModalPack implements the SafeAuthClient interface for adapting the Web3Auth service provider
 * @class
 */
export class Web3AuthModalPack extends AuthKitBasePack {
  #provider: ExternalProvider | null
  #config: Web3AuthConfig
  torus!: Torus

  /**
   * Instantiate the Web3AuthModalPack
   * @param config Web3Auth specific config
   */
  constructor(config: Web3AuthConfig) {
    super()
    this.#config = config
    this.#provider = null
  }

  /**
   * Initialize the Web3Auth service provider
   * @param options Web3Auth options {@link https://web3auth.io/docs/sdk/web/modal/initialize#arguments}
   * @param adapters Web3Auth adapters {@link https://web3auth.io/docs/sdk/web/modal/initialize#configuring-adapters}
   * @param modalConfig The modal configuration {@link https://web3auth.io/docs/sdk/web/modal/whitelabel#whitelabeling-while-modal-initialization}
   * @throws Error if there was an error initializing Web3Auth
   */
  async init(options: TorusParams) {
    try {
      this.torus = new Torus()

      await this.torus.init(options)

      if (this.torus.provider) {
        this.#provider = this.torus.provider
      }
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Web3Auth service provider
   * @returns The sign in data from the provider
   */
  async signIn(): Promise<AuthKitSignInData> {
    if (!this.torus) {
      throw new Error('Web3Auth SDK is not initialized')
    }

    await this.torus.login()

    if (this.torus.provider) {
      this.#provider = this.torus.provider
    }

    const eoa = await this.getAddress()
    const safes = await this.getSafes(this.#config?.txServiceUrl || '')

    const signInData = {
      eoa,
      safes
    }

    return signInData
  }

  getProvider(): ExternalProvider | null {
    return this.#provider
  }

  /**
   * Disconnect from the Web3Auth service provider
   */
  async signOut() {
    if (!this.torus) {
      throw new Error('Web3Auth SDK is not initialized')
    }

    this.#provider = null
    await this.torus.logout()
  }

  /**
   * Get authenticated user information
   * @returns The user info
   */
  async getUserInfo(): Promise<UserInfo> {
    if (!this.torus) {
      throw new Error('Web3Auth SDK is not initialized')
    }

    const userInfo = this.torus.getUserInfo()

    return userInfo
  }

  /**
   * Allow to subscribe to the Web3Auth events
   * @param event The event you want to subscribe to (https://web3auth.io/docs/sdk/web/modal/initialize#subscribing-the-lifecycle-events)
   * @param handler The event handler
   */
  subscribe(event: Web3AuthEvent, handler: Web3AuthEventListener): void {
    throw new Error('Method not implemented.')
  }

  /**
   * Allow to unsubscribe to the Web3Auth events
   * @param event The event you want to unsubscribe to (https://web3auth.io/docs/sdk/web/modal/initialize#subscribing-the-lifecycle-events)
   * @param handler The event handler
   */
  unsubscribe(event: Web3AuthEvent, handler: Web3AuthEventListener): void {
    throw new Error('Method not implemented.')
  }
}
