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
  onMessage: (message: MoneriumNotificationMessage) => void
}

export type MoneriumNotificationMessage = {
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
