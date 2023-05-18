import { IAdapter, UserInfo } from '@web3auth/base'
import { ModalConfig, Web3Auth, Web3AuthOptions } from '@web3auth/modal'
import { ExternalProvider } from '@ethersproject/providers'

import { getErrorMessage } from '@safe-global/auth-kit/lib/errors'
import { Web3AuthEvent, Web3AuthEventListener } from './types'
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack'

/**
 * Web3AuthModalPack implements the SafeAuthClient interface for adapting the Web3Auth service provider
 * @class
 */
export class Web3AuthModalPack extends AuthKitBasePack {
  #config: { txServiceUrl: string }
  provider: ExternalProvider | null
  private web3authInstance?: Web3Auth

  /**
   *
   * @param options Web3Auth options {@link https://web3auth.io/docs/sdk/web/modal/initialize#arguments}
   * @param config Web3Auth adapters {@link https://web3auth.io/docs/sdk/web/modal/initialize#configuring-adapters}
   * @param modalConfig The modal configuration {@link https://web3auth.io/docs/sdk/web/modal/whitelabel#whitelabeling-while-modal-initialization}
   */
  constructor(config: { txServiceUrl: string }) {
    super()
    this.#config = config
    this.provider = null
  }

  /**
   * Initialize the Web3Auth service provider
   * @throws Error if there was an error initializing Web3Auth
   */
  async init({
    options,
    adapters,
    modalConfig
  }: {
    options: Web3AuthOptions
    adapters?: IAdapter<unknown>[]
    modalConfig?: Record<string, ModalConfig>
  }) {
    try {
      this.web3authInstance = new Web3Auth(options)

      adapters?.forEach((adapter) => this.web3authInstance?.configureAdapter(adapter))

      await this.web3authInstance.initModal({ modalConfig: modalConfig })

      this.provider = this.web3authInstance.provider
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Web3Auth service provider
   * @returns
   */
  async signIn() {
    if (!this.web3authInstance) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    this.provider = await this.web3authInstance.connect()

    return {
      eoa: await this.getAddress(),
      safes: await this.getSafes(this.#config?.txServiceUrl || '')
    }
  }

  getProvider(): ExternalProvider {
    if (!this.provider) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    return this.provider
  }

  /**
   * Disconnect from the Web3Auth service provider
   */
  async signOut() {
    if (!this.web3authInstance) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    this.provider = null
    await this.web3authInstance.logout()
  }

  /**
   * Get authenticated user information
   * @returns The user info
   */
  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.web3authInstance) {
      throw new Error('Web3AuthModalPack is not initialized')
    }

    const userInfo = await this.web3authInstance.getUserInfo()

    return userInfo
  }

  /**
   * Allow to subscribe to the Web3Auth events
   * @param event The event you want to subscribe to (https://web3auth.io/docs/sdk/web/modal/initialize#subscribing-the-lifecycle-events)
   * @param handler The event handler
   */
  subscribe(event: Web3AuthEvent, handler: Web3AuthEventListener): void {
    this.web3authInstance?.on(event, handler)
  }

  /**
   * Allow to unsubscribe to the Web3Auth events
   * @param event The event you want to unsubscribe to (https://web3auth.io/docs/sdk/web/modal/initialize#subscribing-the-lifecycle-events)
   * @param handler The event handler
   */
  unsubscribe(event: Web3AuthEvent, handler: Web3AuthEventListener): void {
    this.web3authInstance?.off(event, handler)
  }
}
