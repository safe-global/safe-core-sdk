import { loadStripeOnramp, OnrampSession, OnrampUIEventMap, StripeOnramp } from '@stripe/crypto'
import * as stripeApi from './stripeApi'
import { getErrorMessage } from '@safe-global/onramp-kit/lib/errors'

import type {
  StripeProviderConfig,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions,
  StripeSession
} from './types'
import type { SafeOnRampPack } from '@safe-global/onramp-kit/types'

/**
 * This class implements the SafeOnRampClient interface for the Stripe provider
 * @class StripePack
 */
export class StripePack implements SafeOnRampPack<StripePack> {
  #element?: string
  #stripeOnRamp?: StripeOnramp
  #onRampSession?: OnrampSession
  #config: StripeProviderConfig

  /**
   * Initialize the StripePack
   * @constructor
   * @param config The configuration object for the Stripe provider. Ideally we will put here things like api keys, secrets, urls, etc.
   */
  constructor(config: StripeProviderConfig) {
    this.#config = config
  }

  /**
   * This method loads the Stripe JS files and initializes the StripeOnRamp object
   */
  async init() {
    try {
      this.#stripeOnRamp = (await loadStripeOnramp(this.#config.stripePublicKey)) || undefined
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
    if (!this.#stripeOnRamp) throw new Error('StripeOnRamp is not initialized')

    try {
      let session

      if (sessionId) {
        session = await stripeApi.getSession(this.#config.onRampBackendUrl, sessionId)
      } else {
        session = await stripeApi.createSession(this.#config.onRampBackendUrl, defaultOptions)
      }

      const onRampSession = await this.#stripeOnRamp.createSession({
        clientSecret: session.client_secret,
        appearance: {
          theme: theme
        }
      })

      this.#onRampSession = onRampSession
      this.#element = element

      onRampSession.mount(element)

      // TODO: Remove this check when not required
      this.subscribe(
        'onramp_session_updated',
        (stripeEvent: OnrampUIEventMap['onramp_session_updated']) => {
          this.checkAmount(stripeEvent)
        }
      )

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

  // This is only in order to preserve testnets liquidity pools during the hackaton
  private checkAmount(stripeEvent: any): void {
    if (
      stripeEvent.payload.session.quote &&
      Number(stripeEvent.payload.session.quote.source_monetary_amount?.replace(',', '.')) > 10
    ) {
      document.querySelector(this.#element as string)?.remove()
      throw new Error(
        "The amount you are trying to use to complete your purchase can't be greater than 10 in order to preserve testnets liquidity pools"
      )
    }
  }
}
