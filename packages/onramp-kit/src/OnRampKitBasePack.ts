export abstract class OnRampKitBasePack {
  /**
   * Initialize the pack
   * @param options The provider specific options
   */
  abstract init(options?: unknown): Promise<void>

  /**
   * Start the interaction with the provider
   * @param options The provider specific options to start the interaction
   */
  abstract open(options?: unknown): Promise<unknown>

  /**
   * Close the interaction with the provider and clean up instance and subscriptions
   */
  abstract close(): Promise<void>

  /**
   * Subscribe to provider specific events
   * @param event The event to subscribe to
   * @param handler The handler to be called when the event is triggered
   */
  abstract subscribe(event: unknown, handler: unknown): void

  /**
   * Unsubscribe from provider specific events
   * @param event The event to unsubscribe from
   * @param handler The handler to be removed from the event
   */
  abstract unsubscribe(event: unknown, handler: unknown): void
}
