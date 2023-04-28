import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { getErrorMessage } from './lib/errors'
import {
  ISafeAuthKit,
  SafeAuthPack,
  SafeAuthConfig,
  SafeAuthEvent,
  SafeAuthEventListener,
  SafeAuthSignInData
} from './types'

/**
 * SafeAuthKit provides a simple interface for web2 logins
 */
export class SafeAuthKit<TPack extends SafeAuthPack<TPack>> implements ISafeAuthKit<TPack> {
  #pack: TPack
  #config: SafeAuthConfig | undefined
  safeAuthData?: SafeAuthSignInData

  /**
   * Initialize the SafeAuthKit
   * @constructor
   * @param pack The pack implementing the SafeAuthClient interface
   * @param config The configuration options
   */
  constructor(pack: TPack, config?: SafeAuthConfig) {
    this.#pack = pack
    this.#config = config
  }

  /**
   * The static method allows to initialize the SafeAuthKit asynchronously
   * @param providerType Choose the provider service to use
   * @param config The configuration including the one for the specific provider
   * @returns A SafeAuthKit instance
   * @throws Error if the provider type is not supported
   */
  static async init<TPack extends SafeAuthPack<TPack>>(
    pack: TPack,
    config?: SafeAuthConfig
  ): Promise<SafeAuthKit<TPack>> {
    if (!pack) {
      throw new Error('The pack is not defined')
    }

    await pack.init()
    return new this(pack, config)
  }

  /**
   * Authenticate the user
   * @returns the derived external owned account and the safes associated with the user if the txServiceUrl is provided
   * @throws Error if the provider was not created
   * @throws Error if there was an error while trying to get the safes for the current user using the provided txServiceUrl
   */
  async signIn(): Promise<SafeAuthSignInData> {
    await this.#pack.signIn()

    if (!this.#pack.provider) {
      throw new Error('Provider is not defined')
    }

    const ethersProvider = new ethers.providers.Web3Provider(this.#pack.provider)

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
    await this.#pack.signOut()

    this.safeAuthData = undefined
  }

  /**
   *
   * @returns The Ethereum provider
   */
  getProvider() {
    if (!this.#pack) return null

    return this.#pack?.provider
  }

  /**
   * Retrieve the user info
   */
  async getUserInfo() {
    if (!this.#pack) return null

    return this.#pack?.getUserInfo()
  }

  /**
   * Subscribe to an event
   * @param eventName The event name to subscribe to. Choose from SafeAuthEvents type
   * @param listener The callback function to be called when the event is emitted
   */
  subscribe(event: SafeAuthEvent<TPack>, listener: SafeAuthEventListener<TPack>) {
    this.#pack.subscribe(event, listener)
  }

  /**
   * Unsubscribe from an event
   * @param eventName The event name to unsubscribe from. Choose from SafeAuthEvents type
   * @param listener The callback function to unsubscribe
   */
  unsubscribe(event: SafeAuthEvent<TPack>, listener: SafeAuthEventListener<TPack>) {
    this.#pack.unsubscribe(event, listener)
  }

  /**
   * Get the SafeApiKit instance
   * @returns A SafeApiKit instance
   */
  #getSafeCoreClient(): SafeApiKit {
    if (!this.#pack?.provider) {
      throw new Error('Provider is not defined')
    }

    if (!this.#config?.txServiceUrl) {
      throw new Error('txServiceUrl is not defined')
    }

    const provider = new ethers.providers.Web3Provider(this.#pack.provider)
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
