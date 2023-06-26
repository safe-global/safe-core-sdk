import { Magic } from 'magic-sdk'
import EventEmitter from 'events'
import { ExternalProvider } from '@ethersproject/providers'

import { getErrorMessage } from '@safe-global/auth-kit/lib/errors'
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack'
import type { AuthKitSignInData } from '@safe-global/auth-kit/types'

import {
  MagicConfig,
  MagicInitOptions,
  MagicEvent,
  MagicEventListener,
  MAGIC_EVENT_DISCONNECTED,
  MAGIC_EVENT_CONNECTED
} from './types'

/**
 * MagicConnectPack adapts Magic Connect to be used with Safe Accounts
 * @class
 */
export class MagicConnectPack extends AuthKitBasePack {
  #provider: ExternalProvider | null
  #config: MagicConfig
  magicSdk?: Magic
  #eventEmitter: EventEmitter

  /**
   * Instantiate the MagicConnectPack
   * @param config Magic specific config
   */
  constructor(config: MagicConfig) {
    super()
    this.#config = config
    this.#provider = null
    this.#eventEmitter = new EventEmitter()
  }

  /**
   * Initialize the Magic SDK
   * @param options Magic options {@link https://magic.link/docs/connect/wallet-api-reference/javascript-client-sdk#magic()}
   * @throws Error if there was an error initializing Magic
   */
  async init({ apiKey, options }: MagicInitOptions) {
    try {
      this.magicSdk = new Magic(apiKey, options)

      this.#provider = (await this.magicSdk.wallet.getProvider()) as ExternalProvider
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Magic service provider
   * @returns The sign in data from the provider
   */
  async signIn(): Promise<AuthKitSignInData> {
    if (!this.magicSdk) {
      throw new Error('The Magic SDK is not initialized')
    }

    const isLoggedIn = await this.magicSdk.user.isLoggedIn()

    if (!isLoggedIn) {
      await this.magicSdk.wallet.connectWithUI()
    }

    this.#provider = (await this.magicSdk.wallet.getProvider()) as ExternalProvider

    const eoa = await this.getAddress()
    const safes = await this.getSafes(this.#config?.txServiceUrl || '')

    const signInData = {
      eoa,
      safes
    }

    this.#eventEmitter.emit(MAGIC_EVENT_CONNECTED, signInData)

    return signInData
  }

  getProvider(): ExternalProvider | null {
    return this.#provider
  }

  /**
   * Disconnect from the Magic service provider
   */
  async signOut() {
    if (!this.magicSdk) {
      throw new Error('The Magic SDK is not initialized')
    }

    await this.magicSdk.wallet.disconnect()

    this.#provider = null
    this.#eventEmitter.emit(MAGIC_EVENT_DISCONNECTED)
  }

  /**
   * Get user information. Currently only email is supported
   * This method shows an UI to the user asking for permissions to share personal data
   * @returns The user info
   */
  async getUserInfo(): Promise<{ email?: string }> {
    if (!this.magicSdk) {
      throw new Error('The Magic SDK is not initialized')
    }

    const userInfo = await this.magicSdk.wallet.requestUserInfoWithUI({
      scope: { email: 'required' }
    })

    return userInfo
  }

  /**
   * Allow to subscribe to the Magic events
   * @param event The event you want to subscribe to
   * @param handler The event handler
   */
  subscribe(event: MagicEvent, handler: MagicEventListener): void {
    this.#eventEmitter.on(event, handler)
  }

  /**
   * Allow to unsubscribe to the Magic events
   * @param event The event you want to unsubscribe to
   * @param handler The event handler
   */
  unsubscribe(event: MagicEvent, handler: MagicEventListener): void {
    this.#eventEmitter.off(event, handler)
  }
}
