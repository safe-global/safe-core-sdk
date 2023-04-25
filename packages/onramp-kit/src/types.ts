import Safe from '@safe-global/protocol-kit'
import { MoneriumPack } from './packs/monerium/MoneriumPack'
import { SafeMoneriumClient } from './packs/monerium/SafeMoneriumClient'
import { MoneriumOpenOptions } from './packs/monerium/types'
import { StripeAdapter } from './packs/stripe/StripeAdapter'
import {
  StripeSession,
  StripeEvent,
  StripeEventListener,
  StripeOpenOptions
} from './packs/stripe/types'

declare global {
  interface Window {
    ethereum?: any
  }
}

// The new adapters must implement this interface
export interface SafeOnRampAdapter<TAdapter> {
  init(safeSdk?: Safe): Promise<void>
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
export type SafeOnRampOpenOptions<T> = T extends StripeAdapter
  ? StripeOpenOptions
  : T extends MoneriumPack
  ? MoneriumOpenOptions
  : never
export type SafeOnRampOpenResponse<T> = T extends StripeAdapter
  ? StripeSession
  : T extends MoneriumPack
  ? SafeMoneriumClient
  : never
export type SafeOnRampEvent<T> = T extends StripeAdapter ? StripeEvent : never
export type SafeOnRampEventListener<T> = T extends StripeAdapter ? StripeEventListener : never
