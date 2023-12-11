import { Counterpart, MoneriumEvent, MoneriumEventListener } from '@monerium/sdk'
import Safe from '@safe-global/protocol-kit'

export interface MoneriumProviderConfig {
  clientId: string
  redirectUrl: string
  environment: 'production' | 'sandbox'
}

export interface MoneriumInitOptions {
  safeSdk: Safe
}

export interface SafeMoneriumOrder {
  amount: string
  counterpart: Counterpart
  memo: string
}

export type MoneriumWebSocketOptions = {
  profile: string
  accessToken: string
  env: 'production' | 'sandbox'
  subscriptions: Map<MoneriumEvent, MoneriumEventListener>
}

export type MoneriumOpenOptions = {
  initiateAuthFlow?: boolean
}
