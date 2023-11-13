import { ExternalProvider } from '@ethersproject/providers'
import WsEmbed, { TorusInPageProvider } from '@web3auth/ws-embed'
import { getErrorMessage } from '@safe-global/auth-kit/lib/errors'
import {
  SafeAuthConfig,
  SafeAuthEvent,
  SafeAuthEventListener,
  SafeAuthInitOptions,
  SafeAuthSignInOptions,
  SafeAuthSignOutOptions,
  SafeAuthUserInfo
} from './types'
import { AuthKitBasePack } from '@safe-global/auth-kit/AuthKitBasePack'
import type { AuthKitSignInData } from '@safe-global/auth-kit/types'
import { WALLET_URLS } from './constants'

const WS_EMBED_NOT_INITIALIZED = 'WsEmbed SDK is not initialized'
const WS_EMBED_INVALID_PROVIDER = 'WsEmbed provider is not valid'

/**
 * SafeAuthPack uses the Web3Auth services to get a signer address across different dApps
 * @class
 */
export class SafeAuthPack extends AuthKitBasePack {
  wsEmbed!: WsEmbed
  #provider: ExternalProvider | null
  #config: SafeAuthConfig

  /**
   * Instantiate the SafeAuthPack
   * @param config SafeAuth config
   */
  constructor(config: SafeAuthConfig) {
    super()

    this.#config = config
    this.#provider = null
  }

  /**
   * Check if the user is authenticated
   * Checking the communication provider for this information
   */
  get isAuthenticated(): boolean {
    return this.wsEmbed.communicationProvider.isLoggedIn
  }

  /**
   * Initialize the SafeAuthPack
   * @param options The options to initialize the SafeAuthPack
   * @throws Error if there was an error initializing the Web3Auth WsEmbed
   */
  async init(options: SafeAuthInitOptions) {
    try {
      this.wsEmbed = new WsEmbed()

      await this.wsEmbed.init({ ...options, walletUrls: WALLET_URLS })

      if (!this.wsEmbed.communicationProvider.isWeb3Auth) {
        throw new Error(WS_EMBED_INVALID_PROVIDER)
      }

      this.#provider = this.wsEmbed.provider
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
    if (!this.wsEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    await this.wsEmbed.login(options)

    this.#provider = this.wsEmbed.provider

    const eoa = await this.getAddress()
    const safes = await this.getSafes(this.#config?.txServiceUrl || '')

    return { eoa, safes }
  }

  /**
   * Get the provider returned by the Web3Auth WsEmbed
   * @returns A EIP-1193 compatible provider. Can be wrapped with ethers or web3
   */
  getProvider(): ExternalProvider | null {
    return this.#provider
  }

  /**
   * Disconnect from the Web3Auth services and logout
   * Use reset parameter to true when you want to remove completely the iframe.
   * When this is false you can logout and login again without the need to refresh the page.
   * You need to re-instantiate the pack if you reset completely it
   * @param options The options to disconnect from the Web3Auth services
   */
  async signOut(options?: SafeAuthSignOutOptions) {
    if (!this.wsEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    this.#provider = null

    if (options?.reset) {
      await this.wsEmbed.cleanUp()
    } else {
      await this.wsEmbed.logout()
    }
  }

  /**
   * Get user information. Use it after authentication
   * @returns The specific user information coming from the oAuth or email provider
   * @throws Error if there was an error initializing the Web3Auth WsEmbed
   */
  async getUserInfo(): Promise<SafeAuthUserInfo> {
    if (!this.wsEmbed) {
      throw new Error(WS_EMBED_NOT_INITIALIZED)
    }

    const userInfo = this.wsEmbed.getUserInfo()

    return userInfo
  }

  /**
   * Remove the Web3Auth WsEmbed iframe from the DOM. Useful if you need to re-instantiate the pack
   * with an alternative configuration
   */
  destroy() {
    this.wsEmbed.clearInit()
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
