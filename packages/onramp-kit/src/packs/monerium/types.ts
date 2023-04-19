import { Chain, Currency, Counterpart, Network } from '@monerium/sdk'

export interface MoneriumProviderConfig {
  clientId: string
  environment: 'production' | 'sandbox'
}

export interface MoneriumOpenOptions {
  redirect_uri: string
  address?: string
  signature?: string
  chain?: Chain
  network?: Network
}

export interface SafeMoneriumOrder {
  safeAddress: string
  amount: string
  currency: Currency
  counterpart: Counterpart
  memo: string
}
