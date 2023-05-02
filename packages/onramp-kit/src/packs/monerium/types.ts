import { OrderMetadata } from '@monerium/sdk'
import { Fee } from '@monerium/sdk'
import { OrderState } from '@monerium/sdk'
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

export type MoneriumWebSocketOptions = {
  profile: string
  accessToken: string
  env: 'production' | 'sandbox'
  subscriptions: Map<MoneriumEvent, MoneriumEventListener>
}

export type MoneriumNotification = {
  id: string
  profile: string
  accountId: string
  address: string
  kind: string
  amount: string
  currency: string
  totalFee: string
  fees: Fee[]
  counterpart: Counterpart
  memo: string
  rejectedReason: string
  supportingDocumentId: string
  meta: OrderMetadata
}

export type MoneriumEvent = OrderState

export type MoneriumEventListener = (notification: MoneriumNotification) => void
