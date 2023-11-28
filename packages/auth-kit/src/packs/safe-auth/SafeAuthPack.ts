import { Eip1193Provider } from 'ethers'
import SafeAuthEmbed from '@web3auth/safeauth-embed'
import { TorusInPageProvider, WsEmbedParams } from '@web3auth/ws-embed'
import { getErrorMessage } from '@safe-global/auth-kit/lib/errors'
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack'
import {
  SafeAuthConfig,
  SafeAuthEvent,
  SafeAuthEventListener,
  SafeAuthInitOptions,
  SafeAuthSignInOptions,
  SafeAuthSignOutOptions,
  SafeAuthUserInfo
} from './types'

import type { AuthKitSignInData } from '@safe-global/auth-kit/types'
import { CHAIN_CONFIG } from './constants'

const SAFE_WALLET_SERVICES_URL = 'https://safe.web3auth.com'
const WS_EMBED_NOT_INITIALIZED = 'SafeEmbed SDK is not initialized'

/**
 * SafeAuthPack uses the Web3Auth services to get a signer address across different dApps
 * @class
 */
export class SafeAuthPack extends AuthKitBasePack {
  safeAuthEmbed!: SafeAuthEmbed
  #provider: Eip1193Provider | null
  #config?: SafeAuthConfig

  /**
   * Instantiate the SafeAuthPack
   * @param config SafeAuth config
   */
  constructor(config?: SafeAuthConfig) {
    super()

    this.#config = config
    this.#provider = null
  }

  /**
   * Check if the user is authenticated
   * Checking the communication provider for this information
   */
  get isAuthenticated(): boolean {
    return this.safeAuthEmbed.communicationProvider.isLoggedIn
  }

  /**
   * Initialize the SafeAuthPack
   * @param options The options to initialize the SafeAuthPack
   * @throws Error if there was an error initializing the Web3Auth WsEmbed
   */
  async init(options: SafeAuthInitOptions) {
    try {
      this.safeAuthEmbed = new SafeAuthEmbed()

      const chainConfig =
        options.chainConfig &&
        ({
          ...CHAIN_CONFIG[options.chainConfig.chainId],
          chainId: options.chainConfig?.chainId,
          rpcTarget: options.chainConfig?.rpcTarget
        } as WsEmbedParams['chainConfig'])

      await this.safeAuthEmbed.init({
        ...options,
        chainConfig,
        walletUrls: {
          production: { url: SAFE_WALLET_SERVICES_URL, logLevel: 'error' }
        }
      })

      this.#provider = this.safeAuthEmbed.provider
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Web3Auth services and login
   * @param options The options to connect to the Web3Auth services
   * When loginProvider is specified the native provider authentication will be used instead the provider selector UI modal
   * @returns An AuthKitSignInData object with the signer address and the associated safes
   */
  async signIn(options?: SafeAuthSignInOptions): Promise<AuthKitSignInData> {
    if (!this.safeAuthEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    await this.safeAuthEmbed.login(options)

    this.#provider = this.safeAuthEmbed.provider

    const eoa = await this.getAddress()
    const safes = await this.getSafes(this.#config?.txServiceUrl)

    return { eoa, safes }
  }

  /**
   * Get the provider returned by the Web3Auth WsEmbed
   * @returns A EIP-1193 compatible provider. Can be wrapped with ethers or web3
   */
  getProvider(): Eip1193Provider | null {
    return this.#provider as Eip1193Provider
  }

  /**
   * Disconnect from the Web3Auth services and logout
   * Use reset parameter to true when you want to remove completely the iframe.
   * When this is false you can logout and login again without the need to refresh the page.
   * You need to re-instantiate the pack if you reset completely it
   * @param options The options to disconnect from the Web3Auth services
   */
  async signOut(options?: SafeAuthSignOutOptions) {
    if (!this.safeAuthEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    this.#provider = null

    if (options?.reset) {
      await this.safeAuthEmbed.cleanUp()
    } else {
      await this.safeAuthEmbed.logout()
    }
  }

  /**
   * Get user information. Use it after authentication
   * @returns The specific user information coming from the oAuth or email provider
   * @throws Error if there was an error initializing the Web3Auth WsEmbed
   */
  async getUserInfo(): Promise<SafeAuthUserInfo> {
    if (!this.safeAuthEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    const userInfo = this.safeAuthEmbed.getUserInfo()

    return userInfo
  }

  /**
   * Remove the Web3Auth WsEmbed iframe from the DOM. Useful if you need to re-instantiate the pack
   * with an alternative configuration
   */
  destroy() {
    this.safeAuthEmbed.clearInit()
  }

  /**
   * Subscribe to events (accountsChanged, chainChanged)
   * You can use the accountsChanged event to check the accounts and
   * as an indicator that a first authentication happened, so if the page
   * is refreshed you can call the signIn method immediately
   * @param event The event you want to subscribe to
   * @param handler The event handler
   */
  subscribe(event: SafeAuthEvent, handler: SafeAuthEventListener): void {
    const provider = this.getProvider() as TorusInPageProvider

    provider.on(event, handler)
  }

  /**
   * Unsubscribe from events
   * @param event The event you want to unsubscribe from
   * @param handler The event handler
   */
  unsubscribe(event: SafeAuthEvent, handler: SafeAuthEventListener): void {
    const provider = this.getProvider() as TorusInPageProvider

    provider.off(event, handler)
  }
}
