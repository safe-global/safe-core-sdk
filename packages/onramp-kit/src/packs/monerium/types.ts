import { Currency, Counterpart } from '@monerium/sdk'

export interface MoneriumProviderConfig {
  clientId: string
  environment: 'production' | 'sandbox'
}

export interface MoneriumOpenOptions {
  redirect_uri: string
  authCode?: string
  refreshToken?: string
}

export interface SafeMoneriumOrder {
  safeAddress: string
  amount: string
  currency: Currency
  counterpart: Counterpart
  memo: string
}
