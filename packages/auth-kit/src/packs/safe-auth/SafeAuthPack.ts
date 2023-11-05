import { ExternalProvider } from '@ethersproject/providers'
import Web3AuthSDK, { TorusInPageProvider } from '@web3auth/ws-embed'
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

const SDK_NOT_INITIALIZED = 'Web3Auth SDK is not initialized'

/**
 * SafeAuthPack uses the Web3Auth services to get a signer address across different dApps
 * @class
 */
export class SafeAuthPack extends AuthKitBasePack {
  sdk!: Web3AuthSDK
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
   * Returns ig the user is already authenticated
   * The user is authenticated when the communicationProvider is available
   */
  get isAuthenticated(): boolean {
    return this.sdk.communicationProvider.isLoggedIn
  }

  /**
   * Initialize the SafeAuthPack
   * @param options The options to initialize the SafeAuthPack
   * @throws Error if there was an error initializing the SafeAuthPack
   */
  async init(options: SafeAuthInitOptions) {
    try {
      this.sdk = new Web3AuthSDK()

      await this.sdk.init(options)

      this.#provider = this.sdk.provider
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * Connect to the Web3Auth services and login
   * @param options The options to connect to the Web3Auth services
   * @returns An AuthKitSignInData object with the signer address and the associated safes
   */
  async signIn(options?: SafeAuthSignInOptions): Promise<AuthKitSignInData> {
    if (!this.sdk) {
      throw new Error(SDK_NOT_INITIALIZED)
    }

    await this.sdk.login(options)

    const eoa = await this.getAddress()
    const safes = await this.getSafes(this.#config?.txServiceUrl || '')

    const signInData = {
      eoa,
      safes
    }

    return signInData
  }

  /**
   * Get the provider if available
   * @returns A EIP-1193 compatible provider
   */
  getProvider(): ExternalProvider | null {
    return this.#provider
  }

  /**
   * Disconnect from the Web3Auth services and logout
   * @param options The options to disconnect from the Web3Auth services
   */
  async signOut(options?: SafeAuthSignOutOptions) {
    if (!this.sdk) {
      throw new Error(SDK_NOT_INITIALIZED)
    }

    this.#provider = null

    if (options?.reset) {
      await this.sdk.cleanUp()
    } else {
      await this.sdk.logout()
    }
  }

  /**
   * Get user information once authenticated
   * @returns The specific SafeAuthUserInfo
   */
  async getUserInfo(): Promise<SafeAuthUserInfo> {
    if (!this.sdk) {
      throw new Error(SDK_NOT_INITIALIZED)
    }

    const userInfo = this.sdk.getUserInfo()

    return userInfo
  }

  /**
   * Subscribe to the events
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
