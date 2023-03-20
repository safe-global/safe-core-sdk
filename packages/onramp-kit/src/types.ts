import { StripeAdapter } from './packs/stripe/StripeAdapter'
import {
  StripeSession,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions
} from './packs/stripe/types'

// The new adapters must implement this interface
export interface SafeOnRampAdapter<TAdapter> {
  init(): Promise<void>
  open(options?: SafeOnRampOpenOptions<TAdapter>): Promise<SafeOnRampOpenResponse<TAdapter>>
  close(): Promise<void>
  subscribe(event: SafeOnRampEvent<TAdapter>, handler: SafeOnRampEventListener<TAdapter>): void
  unsubscribe(event: SafeOnRampEvent<TAdapter>, handler: SafeOnRampEventListener<TAdapter>): void
}

// When creating new adapters these types should be updated:
// e.g.:
// export type SafeOnRampOpenOptions<T> =
//    T extends StripeAdapter ? StripeOpenOptions :
//    T extends FooAdapter ? FooOpenOptions :
//    T extends BarAdapter ? BarOpenOptions :
//    never
export type SafeOnRampOpenOptions<T> = T extends StripeAdapter ? StripeOpenOptions : never
export type SafeOnRampOpenResponse<T> = T extends StripeAdapter ? StripeSession : never
export type SafeOnRampEvent<T> = T extends StripeAdapter ? StripeEvent : never
export type SafeOnRampEventListener<T> = T extends StripeAdapter ? StripeEventListener : never
