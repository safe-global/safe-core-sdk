import { IAdapter } from '@web3auth/base'
import { ModalConfig, Web3Auth, Web3AuthOptions } from '@web3auth/modal'
import { ExternalProvider } from '@ethersproject/providers'

import type { SafeAuthAdapter } from '../../types'
import { getErrorMessage } from '../../lib/errors'
import { Web3AuthEvent, Web3AuthEventListener } from './types'

/**
 * Web3AuthAdapter implements the SafeAuthClient interface for adapting the Web3Auth service provider
 * @class
 */
export class Web3AuthAdapter implements SafeAuthAdapter<Web3AuthAdapter> {
  provider: ExternalProvider | null
  private web3authInstance?: Web3Auth
  #options: Web3AuthOptions
  #adapters?: IAdapter<unknown>[]
  #modalConfig?: Record<string, ModalConfig>

  /**
   *
   * @param options Web3Auth options {@link https://web3auth.io/docs/sdk/web/modal/initialize#arguments}
   * @param config Web3Auth adapters {@link https://web3auth.io/docs/sdk/web/modal/initialize#configuring-adapters}
   * @param modalConfig The modal configuration {@link https://web3auth.io/docs/sdk/web/modal/whitelabel#whitelabeling-while-modal-initialization}
   */
  constructor(
    options: Web3AuthOptions,
    adapters?: IAdapter<unknown>[],
    modalConfig?: Record<string, ModalConfig>
  ) {
    this.provider = null
    this.#options = options
    this.#adapters = adapters
    this.#modalConfig = modalConfig
  }

  /**
   * Initialize the Web3Auth service provider
   * @throws Error if there was an error initializing Web3Auth
   */
  async init() {
    try {
      this.web3authInstance = new Web3Auth(this.#options)

      this.#adapters?.forEach((adapter) => this.web3authInstance?.configureAdapter(adapter))

      this.provider = this.web3authInstance.provider

      await this.web3authInstance.initModal({ modalConfig: this.#modalConfig })
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Web3Auth service provider
   * @returns
   */
  async signIn(): Promise<void> {
    if (!this.web3authInstance) return

    this.provider = await this.web3authInstance.connect()
  }

  /**
   * Disconnect from the Web3Auth service provider
   */
  async signOut(): Promise<void> {
    if (!this.web3authInstance) return

    this.provider = null
    await this.web3authInstance.logout()
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
