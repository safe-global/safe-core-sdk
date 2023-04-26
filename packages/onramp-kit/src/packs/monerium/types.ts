import { OrderState } from '@monerium/sdk'
import { Currency, Counterpart, Order } from '@monerium/sdk'

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
  fees: any[]
  counterpart: {
    identifier: any
    details: any
  }
  memo: string
  rejectedReason: any
  supportingDocumentId: string
  meta: {
    approvedAt: string
    processedAt: string
    rejectedAt: string
    state: string
    placedBy: string
    placedAt: string
    receivedAmount: string
    sentAmount: string
  }
}

export type MoneriumEvent = OrderState

export type MoneriumEventListener = (notification: MoneriumNotification) => void
