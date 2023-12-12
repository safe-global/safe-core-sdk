import { Currency, constants, MoneriumEvent, MoneriumEventListener } from '@monerium/sdk'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { OnRampKitBasePack } from '@safe-global/onramp-kit/OnRampKitBasePack'

import { SafeMoneriumClient } from './SafeMoneriumClient'
import { MoneriumInitOptions, MoneriumOpenOptions, MoneriumProviderConfig } from './types'

const SIGNATURE_MESSAGE = constants.LINK_MESSAGE

/**
 * This class extends the OnRampKitBasePack to work with the Monerium platform
 * @class MoneriumPack
 */
export class MoneriumPack extends OnRampKitBasePack {
  #config: MoneriumProviderConfig
  client?: SafeMoneriumClient

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

    this.client = new SafeMoneriumClient(
      {
        environment: this.#config.environment,
        clientId: this.#config.clientId,
        redirectUrl: this.#config.redirectUrl
      },
      options.safeSdk
    )
  }

  /**
   * This method initialize the flow with Monerium in order to gain access to the resources
   * using the access_token. Return a initialized {@link SafeMoneriumClient}
   * @param {MoneriumOpenOptions} [options] The MoneriumOpenOptions object
   * @returns A {@link SafeMoneriumClient} instance
   */
  async open(options?: MoneriumOpenOptions): Promise<SafeMoneriumClient> {
    if (!this.client) {
      throw new Error('Monerium client not initialized')
    }

    try {
      const safeAddress = await this.client.getSafeAddress()
      const isAuthorized = await this.client.getAccess()

      if (isAuthorized) {
        await this.#addAccountIfNotLinked(safeAddress)
      } else if (options?.initiateAuthFlow) {
        await this.#startAuthFlow(safeAddress)
      }

      // When the user is authenticated, we connect to the order notifications socket in case
      // the user has subscribed to any event
      await this.client.connectOrderSocket()

      return this.client
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  /**
   * This private method starts the authorization code flow
   * {@link https://monerium.dev/docs/getting-started/auth-flow}
   * @param safeAddress The address of the Safe
   * @param redirectUrl The redirect url from the Monerium UI
   */
  async #startAuthFlow(safeAddress: string) {
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

    await this.client.authorize({
      address: safeAddress,
      signature: '0x',
      chainId: await this.client.getChainId()
    })
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
        (account) => account.address.toLowerCase() === safeAddress.toLowerCase()
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
    this.client?.revokeAccess()
  }

  /**
   * Subscribe to MoneriumEvent to receive notifications using the Monerium API (WebSocket)
   * We are setting a subscription map because we need the user to have a token to start the WebSocket connection
   * {@link https://monerium.dev/api-docs#operation/profile-orders-notifications}
   * @param event The event to subscribe to
   * @param handler The handler to be called when the event is triggered
   */
  subscribe(event: MoneriumEvent, handler: MoneriumEventListener): void {
    this.client?.subscribeOrders(event, handler)
  }

  /**
   * Unsubscribe from MoneriumEvent and close the socket if there are no more subscriptions
   * @param event The event to unsubscribe from
   */
  unsubscribe(event: MoneriumEvent): void {
    this.client?.unsubscribeOrders(event)
  }
}
