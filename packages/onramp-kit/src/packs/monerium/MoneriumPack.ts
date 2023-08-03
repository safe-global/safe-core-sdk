import { Currency, OrderState } from '@monerium/sdk'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { OnRampKitBasePack } from '@safe-global/onramp-kit/OnRampKitBasePack'

import { SafeMoneriumClient } from './SafeMoneriumClient'
import {
  MoneriumEvent,
  MoneriumEventListener,
  MoneriumInitOptions,
  MoneriumOpenOptions,
  MoneriumProviderConfig
} from './types'
import { connectToOrderNotifications } from './sockets'

const MONERIUM_CODE_VERIFIER = 'OnRampKit__monerium_code_verifier'
const SIGNATURE_MESSAGE = 'I hereby declare that I am the address owner.'

/**
 * This class extends the OnRampKitBasePack to work with the Monerium platform
 * @class MoneriumPack
 */
export class MoneriumPack extends OnRampKitBasePack {
  #config: MoneriumProviderConfig
  client?: SafeMoneriumClient
  #socket?: WebSocket
  #subscriptions: Map<MoneriumEvent, MoneriumEventListener> = new Map()

  /**
   * The constructor of the MoneriumPack
   * @constructor
   * @param config The configuration object for the Monerium provider
   */
  constructor(config: MoneriumProviderConfig) {
    super()
    this.#config = config
  }

  /**
   * Initializes the SafeMoneriumClient
   * @param options The MoneriumInitOptions object
   * @throws {Error} If the Monerium client is not initialized
   */
  async init(options: MoneriumInitOptions) {
    if (!options?.safeSdk) {
      throw new Error('You need to provide an instance of the protocol kit')
    }

    this.client = new SafeMoneriumClient(this.#config.environment, options.safeSdk)
  }

  /**
   * This method initialize the flow with Monerium in order to gain access to the resources
   * using the access_token. Return a initialized {@link SafeMoneriumClient}
   * @param options The MoneriumOpenOptions object
   * @returns A {@link SafeMoneriumClient} instance
   */
  async open(options: MoneriumOpenOptions): Promise<SafeMoneriumClient> {
    if (!this.client) {
      throw new Error('Monerium client not initialized')
    }

    try {
      const safeAddress = await this.client.getSafeAddress()

      if (options.authCode) {
        await this.#startAuthCodeFlow(options.authCode, safeAddress, options.redirectUrl || '')
      } else {
        if (options.refreshToken) {
          await this.#startRefreshTokenFlow(safeAddress, options.refreshToken)
        } else {
          await this.#startAuthFlow(safeAddress, options.redirectUrl || '')
        }
      }

      // When the user is authenticated, we connect to the order notifications socket in case
      // the user has subscribed to any event
      if (this.client.bearerProfile?.access_token && this.#subscriptions.size > 0) {
        this.#socket = connectToOrderNotifications({
          profile: this.client.bearerProfile?.profile,
          env: this.#config.environment,
          accessToken: this.client.bearerProfile?.access_token,
          subscriptions: this.#subscriptions
        })
      }

      return this.client
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * This method authorize the user to access the resources using an access code
   * {@link https://monerium.dev/docs/getting-started/auth-flow#initiate}
   * @param codeParam The code param from the query string
   * @param safeAddress The address of the Safe
   * @param redirectUrl The redirect url from the Monerium UI
   */
  async #startAuthCodeFlow(codeParam: string, safeAddress: string, redirectUrl: string) {
    if (!this.client) return

    const codeVerifier = sessionStorage.getItem(MONERIUM_CODE_VERIFIER) || ''

    await this.client.auth({
      client_id: this.#config.clientId,
      code: codeParam,
      code_verifier: codeVerifier,
      redirect_uri: redirectUrl
    })

    await this.#addAccountIfNotLinked(safeAddress)

    this.#cleanQueryString()

    localStorage.removeItem(MONERIUM_CODE_VERIFIER)
  }

  /**
   * This method starts the refresh token flow if the refresh token is provided in the MoneriumOpenOptions
   * {@link https://monerium.dev/docs/getting-started/client-credentials#get-access-token}
   * @param safeAddress The address od the Safe
   * @param refreshToken The refresh token
   */
  async #startRefreshTokenFlow(safeAddress: string, refreshToken: string) {
    if (!this.client) return

    await this.client.auth({
      client_id: this.#config.clientId,
      refresh_token: refreshToken
    })

    this.#addAccountIfNotLinked(safeAddress)
  }

  /**
   * This private method starts the authorization code flow
   * {@link https://monerium.dev/docs/getting-started/auth-flow}
   * @param safeAddress The address of the Safe
   * @param redirectUrl The redirect url from the Monerium UI
   */
  async #startAuthFlow(safeAddress: string, redirectUrl: string) {
    if (!this.client) return

    // Check if the user has already signed the message
    if (safeAddress) {
      // Check if the Safe has a completed transaction with the signature message
      const isSigned = await this.client.isMessageSigned(safeAddress, SIGNATURE_MESSAGE)

      if (!isSigned) {
        // Check if the Safe has a pending transaction with the signature message
        const isPending = await this.client.isSignMessagePending(safeAddress, SIGNATURE_MESSAGE)

        if (!isPending) {
          await this.client.signMessage(safeAddress, SIGNATURE_MESSAGE)
        }
      }
    }

    const authFlowUrl = this.client.getAuthFlowURI({
      client_id: this.#config.clientId,
      redirect_uri: redirectUrl,
      address: safeAddress,
      signature: '0x',
      chain: await this.client.getChain(),
      network: await this.client.getNetwork()
    })

    sessionStorage.setItem(MONERIUM_CODE_VERIFIER, this.client.codeVerifier || '')

    window.location.replace(authFlowUrl)
  }

  /**
   * Add an address to the Monerium account if it is not already linked
   * @param safeAddress The address of the Safe
   */
  async #addAccountIfNotLinked(safeAddress: string) {
    if (!this.client) return

    const authContext = await this.client.getAuthContext()

    if (!authContext) return

    const profile = await this.client.getProfile(authContext.defaultProfile)

    if (profile) {
      const isSafeAddressLinked = profile.accounts.some(
        (account) => account.address === safeAddress
      )

      if (!isSafeAddressLinked) {
        await this.client.linkAddress(authContext.defaultProfile, {
          address: safeAddress,
          message: SIGNATURE_MESSAGE,
          signature: '0x',
          network: await this.client.getNetwork(),
          chain: await this.client.getChain(),
          accounts: [
            {
              network: await this.client.getNetwork(),
              chain: await this.client.getChain(),
              currency: Currency.eur
            }
          ]
        })
      }
    }
  }

  /**
   * Close the flow and clean up
   */
  async close() {
    localStorage.removeItem(MONERIUM_CODE_VERIFIER)
    this.#subscriptions.clear()
    this.#socket?.close()
  }

  /**
   * Subscribe to MoneriumEvent to receive notifications using the Monerium API (WebSocket)
   * We are setting a subscription map because we need the user to have a token to start the WebSocket connection
   * {@link https://monerium.dev/api-docs#operation/profile-orders-notifications}
   * @param event The event to subscribe to
   * @param handler The handler to be called when the event is triggered
   */
  subscribe(event: MoneriumEvent, handler: MoneriumEventListener): void {
    this.#subscriptions.set(event as OrderState, handler)
  }

  /**
   * Unsubscribe from MoneriumEvent and close the socket if there are no more subscriptions
   * @param event The event to unsubscribe from
   */
  unsubscribe(event: MoneriumEvent): void {
    this.#subscriptions.delete(event as OrderState)

    if (this.#subscriptions.size === 0) {
      this.#socket?.close()
      this.#socket = undefined
    }
  }

  /**
   * Clean the query string from the URL
   */
  #cleanQueryString() {
    const url = window.location.href
    const [baseUrl, queryString] = url.split('?')

    // Check if there is a query string
    if (queryString) {
      window.history.replaceState(null, '', baseUrl)
    }
  }
}
