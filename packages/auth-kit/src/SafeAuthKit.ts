import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { getErrorMessage } from './lib/errors'
import {
  ISafeAuthKit,
  SafeAuthAdapter,
  SafeAuthConfig,
  SafeAuthEvent,
  SafeAuthEventListener,
  SafeAuthSignInData
} from './types'

/**
 * SafeAuthKit provides a simple interface for web2 logins
 */
export class SafeAuthKit<TAdapter extends SafeAuthAdapter<TAdapter>>
  implements ISafeAuthKit<TAdapter>
{
  #adapter: TAdapter
  #config: SafeAuthConfig | undefined
  safeAuthData?: SafeAuthSignInData

  /**
   * Initialize the SafeAuthKit
   * @constructor
   * @param client The client implementing the SafeAuthClient interface
   * @param config The configuration options
   */
  constructor(adapter: TAdapter, config?: SafeAuthConfig) {
    this.#adapter = adapter
    this.#config = config
  }

  /**
   * The static method allows to initialize the SafeAuthKit asynchronously
   * @param providerType Choose the provider service to use
   * @param config The configuration including the one for the specific provider
   * @returns A SafeAuthKit instance
   * @throws Error if the provider type is not supported
   */
  static async init<T extends SafeAuthAdapter<T>>(
    adapter: T,
    config?: SafeAuthConfig
  ): Promise<SafeAuthKit<T>> {
    if (!adapter) {
      throw new Error('The adapter is not defined')
    }

    await adapter.init()
    return new this(adapter, config)
  }

  /**
   * Authenticate the user
   * @returns the derived external owned account and the safes associated with the user if the txServiceUrl is provided
   * @throws Error if the provider was not created
   * @throws Error if there was an error while trying to get the safes for the current user using the provided txServiceUrl
   */
  async signIn(): Promise<SafeAuthSignInData> {
    await this.#adapter.signIn()

    if (!this.#adapter.provider) {
      throw new Error('Provider is not defined')
    }

    const ethersProvider = new ethers.providers.Web3Provider(this.#adapter.provider)

    const signer = ethersProvider.getSigner()

    const address = await signer.getAddress()

    let safes: string[] | undefined

    // Retrieve safes if txServiceUrl is provided
    if (this.#config?.txServiceUrl) {
      try {
        const safesByOwner = await this.#getSafeCoreClient().getSafesByOwner(address)
        safes = safesByOwner.safes
      } catch (e) {
        throw new Error(getErrorMessage(e))
      }
    }

    this.safeAuthData = {
      eoa: address,
      safes
    }

    return this.safeAuthData
  }

  /**
   * Sign out the user
   */
  async signOut(): Promise<void> {
    await this.#adapter.signOut()

    this.safeAuthData = undefined
  }

  /**
   *
   * @returns The Ethereum provider
   */
  getProvider() {
    if (!this.#adapter) return null

    return this.#adapter?.provider
  }

  /**
   * Subscribe to an event
   * @param eventName The event name to subscribe to. Choose from SafeAuthEvents type
   * @param listener The callback function to be called when the event is emitted
   */
  subscribe(event: SafeAuthEvent<TAdapter>, listener: SafeAuthEventListener<TAdapter>) {
    this.#adapter.subscribe(event, listener)
  }

  /**
   * Unsubscribe from an event
   * @param eventName The event name to unsubscribe from. Choose from SafeAuthEvents type
   * @param listener The callback function to unsubscribe
   */
  unsubscribe(event: SafeAuthEvent<TAdapter>, listener: SafeAuthEventListener<TAdapter>) {
    this.#adapter.unsubscribe(event, listener)
  }

  /**
   * Get the SafeApiKit instance
   * @returns A SafeApiKit instance
   */
  #getSafeCoreClient(): SafeApiKit {
    if (!this.#adapter?.provider) {
      throw new Error('Provider is not defined')
    }

    if (!this.#config?.txServiceUrl) {
      throw new Error('txServiceUrl is not defined')
    }

    const provider = new ethers.providers.Web3Provider(this.#adapter.provider)
    const safeOwner = provider.getSigner(0)

    const adapter = new EthersAdapter({
      ethers,
      signerOrProvider: safeOwner
    })

    return new SafeApiKit({
      txServiceUrl: this.#config.txServiceUrl,
      ethAdapter: adapter
    })
  }
}
