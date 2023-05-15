export abstract class BasePack<
  TConfig,
  TInitOptions,
  TOpenOptions,
  TOpenResponse,
  TEvent,
  TEventHandler
> {
  config: TConfig

  constructor(config: TConfig) {
    this.config = config
  }

  abstract init(options?: TInitOptions): Promise<void>
  abstract open(options?: TOpenOptions): Promise<TOpenResponse>
  abstract close(): Promise<void>
  abstract subscribe(event: TEvent, handler: TEventHandler): void
  abstract unsubscribe(event: TEvent, handler: TEventHandler): void
}
