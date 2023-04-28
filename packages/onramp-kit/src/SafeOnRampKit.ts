import {
  SafeOnRampPack,
  SafeOnRampEvent,
  SafeOnRampEventListener,
  SafeOnRampOpenOptions,
  SafeOnRampOpenResponse
} from './types'

/**
 * This class allows to initialize the Safe OnRamp Kit for convert fiat to crypto
 * @class SafeOnRampKit
 */
export class SafeOnRampKit<TPack extends SafeOnRampPack<TPack>> {
  #pack: TPack

  /**
   * Initialize the SafeOnRampKit
   * @constructor
   * @param pack The pack implementing the SafeOnRampClient interface for the specific provider
   */
  constructor(pack: TPack) {
    this.#pack = pack
  }

  /**
   * This method initializes the SafeOnRampKit asynchronously. This is the place where we can put initialization magic
   * @param pack The pack implementing the SafeOnRampClient interface for the specific provider
   * @returns A SafeOnRampKit instance
   * @throws Error if the pack is not defined
   */
  static async init<TPack extends SafeOnRampPack<TPack>>(
    pack: TPack
  ): Promise<SafeOnRampKit<TPack>> {
    if (!pack) {
      throw new Error('The pack is not defined')
    }

    await pack.init()
    return new this(pack)
  }

  /**
   * This method opens the onramp widget using the provided options
   * @param options The options to open the specific onramp widget. Should be different per provider
   */
  async open(options?: SafeOnRampOpenOptions<TPack>): Promise<SafeOnRampOpenResponse<TPack>> {
    return await this.#pack.open(options)
  }

  /**
   * This method cleanup the onramp widget
   */
  async close() {
    await this.#pack.close()
  }

  /**
   * Subscribe to provider events
   * @param event The specific event to subscribe to
   * @param handler The handler to be called when the event is triggered
   */
  subscribe(event: SafeOnRampEvent<TPack>, handler: SafeOnRampEventListener<TPack>) {
    this.#pack.subscribe(event, handler)
  }

  /**
   * Unsubscribe from provider events
   * @param event The specific event to unsubscribe from
   * @param handler The handler to be removed from the event
   */
  unsubscribe(event: SafeOnRampEvent<TPack>, handler: SafeOnRampEventListener<TPack>) {
    this.#pack.unsubscribe(event, handler)
  }
}
