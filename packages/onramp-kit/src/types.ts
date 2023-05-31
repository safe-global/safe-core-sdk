import Safe from '@safe-global/protocol-kit'

import {
  StripePack,
  StripeSession,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions
} from './packs/stripe'
import {
  MoneriumPack,
  SafeMoneriumClient,
  MoneriumEvent,
  MoneriumEventListener,
  MoneriumInitOptions,
  MoneriumOpenOptions
} from './packs/monerium'

// The new packs must implement this interface
export interface SafeOnRampPack<TPack> {
  init(options?: SafeOnRampInitOptions<TPack>): Promise<void>
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
export type SafeOnRampInitOptions<TPack> = TPack extends StripePack
  ? undefined
  : TPack extends MoneriumPack
  ? MoneriumInitOptions
  : never
export type SafeOnRampOpenOptions<TPack> = TPack extends StripePack
  ? StripeOpenOptions
  : TPack extends MoneriumPack
  ? MoneriumOpenOptions
  : never
export type SafeOnRampOpenResponse<TPack> = TPack extends StripePack
  ? StripeSession
  : TPack extends MoneriumPack
  ? SafeMoneriumClient
  : never
export type SafeOnRampEvent<TPack> = TPack extends StripePack
  ? StripeEvent
  : TPack extends MoneriumPack
  ? MoneriumEvent
  : never
export type SafeOnRampEventListener<TPack> = TPack extends StripePack
  ? StripeEventListener
  : TPack extends MoneriumPack
  ? MoneriumEventListener
  : never
