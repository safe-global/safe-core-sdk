import { ExternalProvider } from '@ethersproject/providers'
import {
  AggregateVerifierLoginParams,
  UserInfo,
  Web3AuthMPCCoreKit,
  Web3AuthOptions
} from '@web3auth/mpc-core-kit'

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
  web3Auth!: Web3AuthMPCCoreKit

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
  async init(options: Web3AuthOptions) {
    try {
      this.web3Auth = new Web3AuthMPCCoreKit(options)

      await this.web3Auth.init()

      if (this.web3Auth.provider) {
        this.#provider = this.web3Auth.provider
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
    if (!this.web3Auth) {
      throw new Error('Web3Auth is not initialized')
    }

    const verifierConfig = {
      aggregateVerifierIdentifier: 'auth-kit',
      subVerifierDetailsArray: [
        {
          typeOfLogin: 'google',
          verifier: 'auth-kit',
          clientId: '1050634748617-ajb9h2kkv32nf6v152u08sqola6i567r.apps.googleusercontent.com'
        }
      ]
    } as AggregateVerifierLoginParams

    await this.web3Auth.loginWithOauth(verifierConfig)

    if (this.web3Auth.provider) {
      this.#provider = this.web3Auth.provider
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
    if (!this.web3Auth) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    this.#provider = null
    await this.web3Auth.logout()
  }

  /**
   * Get authenticated user information
   * @returns The user info
   */
  async getUserInfo(): Promise<UserInfo> {
    if (!this.web3Auth) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    const userInfo = this.web3Auth.getUserInfo()

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
