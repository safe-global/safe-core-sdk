import { StripePack } from './packs/stripe/StripePack'
import {
  StripeSession,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions
} from './packs/stripe/types'

// The new packs must implement this interface
export interface SafeOnRampPack<TPack> {
  init(): Promise<void>
  open(options?: SafeOnRampOpenOptions<TPack>): Promise<SafeOnRampOpenResponse<TPack>>
  close(): Promise<void>
  subscribe(event: SafeOnRampEvent<TPack>, handler: SafeOnRampEventListener<TPack>): void
  unsubscribe(event: SafeOnRampEvent<TPack>, handler: SafeOnRampEventListener<TPack>): void
}

// When creating new packs these types should be updated:
// e.g.:
// export type SafeOnRampOpenOptions<T> =
//    TPack extends StripePack ? StripeOpenOptions :
//    TPack extends FooPack ? FooOpenOptions :
//    TPack extends BarPack ? BarOpenOptions :
//    never
export type SafeOnRampOpenOptions<TPack> = TPack extends StripePack ? StripeOpenOptions : never
export type SafeOnRampOpenResponse<TPack> = TPack extends StripePack ? StripeSession : never
export type SafeOnRampEvent<TPack> = TPack extends StripePack ? StripeEvent : never
export type SafeOnRampEventListener<TPack> = TPack extends StripePack ? StripeEventListener : never
