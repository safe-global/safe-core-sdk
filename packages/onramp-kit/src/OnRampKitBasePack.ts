export abstract class OnRampKitBasePack {
  abstract init(options?: unknown): Promise<void>
  abstract open(options?: unknown): Promise<unknown>
  abstract close(): Promise<void>
  abstract subscribe(event: unknown, handler: unknown): void
  abstract unsubscribe(event: unknown, handler: unknown): void
}
