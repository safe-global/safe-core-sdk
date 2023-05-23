import { loadStripeOnramp, OnrampSession, StripeOnramp } from '@stripe/crypto'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'
import { OnRampKitBasePack } from '@safe-global/onramp-kit/OnRampKitBasePack'

import * as stripeApi from './stripeApi'

import type {
  StripeProviderConfig,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions,
  StripeSession
} from './types'

/**
 * This class extends the OnRampKitBasePack to work with the Stripe platform
 * @class StripePack
 */
export class StripePack extends OnRampKitBasePack {
  #config: StripeProviderConfig
  #element?: string
  #client?: StripeOnramp
  #onRampSession?: OnrampSession

  /**
   * Initialize the StripePack
   * @constructor
   * @param config The configuration object for the Stripe provider. Ideally we will put here things like api keys, secrets, urls, etc.
   */
  constructor(config: StripeProviderConfig) {
    super()
    this.#config = config
  }

  /**
   * This method loads the Stripe JS files and initializes the StripeOnRamp object
   */
  async init() {
    try {
      this.#client = (await loadStripeOnramp(this.#config.stripePublicKey)) || undefined
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * This method open the onramp widget with the provided Stripe options
   * @param options The options to open the onramp widget
   */
  async open({
    element,
    theme = 'light',
    sessionId,
    defaultOptions
  }: StripeOpenOptions): Promise<StripeSession> {
    if (!this.#client) throw new Error('The Stripe crypto SDK is not initialized')

    try {
      let session

      if (sessionId) {
        session = await stripeApi.getSession(this.#config.onRampBackendUrl, sessionId)
      } else {
        session = await stripeApi.createSession(this.#config.onRampBackendUrl, defaultOptions)
      }

      const onRampSession = this.#client.createSession({
        clientSecret: session.client_secret,
        appearance: {
          theme: theme
        }
      })

      this.#onRampSession = onRampSession
      this.#element = element

      onRampSession.mount(element)

      return session
    } catch (e) {
      throw new Error(getErrorMessage(e))
    }
  }

  /**
   * This method close the onramp widget
   */
  async close() {
    throw new Error('Method not implemented.')
  }

  /**
   * Subscribe to an event
   * @param event The Stripe event to subscribe or '*' to subscribe to all events
   * @param handler The callback to execute when the event is triggered
   */
  subscribe(event: StripeEvent, handler: StripeEventListener): void {
    this.#onRampSession?.addEventListener(event as '*', handler)
  }

  /**
   * Unsubscribe from an event
   * @param event The Stripe event to unsubscribe or '*' to unsubscribe from all events
   * @param handler The callback to remove from the event
   */
  unsubscribe(event: StripeEvent, handler: StripeEventListener): void {
    this.#onRampSession?.removeEventListener(event as '*', handler)
  }
}
