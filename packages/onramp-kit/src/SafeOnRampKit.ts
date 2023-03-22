import {
  SafeOnRampAdapter,
  SafeOnRampEvent,
  SafeOnRampEventListener,
  SafeOnRampOpenOptions,
  SafeOnRampOpenResponse
} from './types'

/**
 * This class allows to initialize the Safe OnRamp Kit for convert fiat to crypto
 * @class SafeOnRampKit
 */
export class SafeOnRampKit<TAdapter extends SafeOnRampAdapter<TAdapter>> {
  #adapter: TAdapter

  /**
   * Initialize the SafeOnRampKit
   * @constructor
   * @param adapter The adapter implementing the SafeOnRampClient interface for the specific provider
   */
  constructor(adapter: TAdapter) {
    this.#adapter = adapter
  }

  /**
   * This method initializes the SafeOnRampKit asynchronously. This is the place where we can put initialization magic
   * @param adapter The adapter implementing the SafeOnRampClient interface for the specific provider
   * @returns A SafeOnRampKit instance
   * @throws Error if the adapter is not defined
   */
  static async init<T extends SafeOnRampAdapter<T>>(adapter: T): Promise<SafeOnRampKit<T>> {
    if (!adapter) {
      throw new Error('The adapter is not defined')
    }

    await adapter.init()
    return new this(adapter)
  }

  /**
   * This method opens the onramp widget using the provided options
   * @param options The options to open the specific onramp widget. Should be different per provider
   */
  async open(options?: SafeOnRampOpenOptions<TAdapter>): Promise<SafeOnRampOpenResponse<TAdapter>> {
    return await this.#adapter.open(options)
  }

  /**
   * This method cleanup the onramp widget
   */
  async close() {
    await this.#adapter.close()
  }

  /**
   * Subscribe to provider events
   * @param event The specific event to subscribe to
   * @param handler The handler to be called when the event is triggered
   */
  subscribe(event: SafeOnRampEvent<TAdapter>, handler: SafeOnRampEventListener<TAdapter>) {
    this.#adapter.subscribe(event, handler)
  }

  /**
   * Unsubscribe from provider events
   * @param event The specific event to unsubscribe from
   * @param handler The handler to be removed from the event
   */
  unsubscribe(event: SafeOnRampEvent<TAdapter>, handler: SafeOnRampEventListener<TAdapter>) {
    this.#adapter.unsubscribe(event, handler)
  }
}
