import { OnrampUIEventListener, OnrampUIEventMap } from '@stripe/crypto'

interface QuoteCurrency {
  id: string
  asset_code: string
  asset_display_name: string
  currency_minor_units: number
  currency_network: string
  currency_symbol: string
  currency_symbol_location: string
}

interface Fees {
  network_fee: string
  network_fee_monetary: string
  total_fee: string
  transaction_fee: string
  transaction_fee_monetary: string
}

interface Quote {
  blockchain_tx_id: string
  destination_amount: string | null
  destination_crypto_amount: string | null
  destination_currency: QuoteCurrency | null
  expiration: number
  fees: Fees
  fixed_currency_side: string
  source_amount: string | null
  source_currency: QuoteCurrency | null
  source_monetary_amount: string | null
  time_to_expiration: number
  total_amount: string
}

interface TransactionDetails {
  transaction_id?: string | null
  destination_amount?: string | null
  destination_crypto_amount?: string | null
  destination_currency?: string | null
  destination_network?: string | null
  lock_wallet_address?: boolean
  source_amount?: string | null
  source_exchange_amount?: string | null
  source_currency?: string | null
  source_monetary_amount?: string | null
  supported_destination_currencies?: string[]
  supported_destination_networks?: string[]
  destination_exchange_amount?: string | null
  wallet_address?: string
  wallet_addresses?: any
}

export interface StripeSession {
  id: string
  object: string
  livemode: boolean
  client_secret: string
  quote?: Quote
  wallet_address?: string
  fixed_transaction_details?: TransactionDetails
  transaction_details?: TransactionDetails
  status: string
}

export interface StripeProviderConfig {
  stripePublicKey: string
  onRampBackendUrl: string
}

export type StripeTransactionOptions = Pick<
  TransactionDetails,
  | 'wallet_address'
  | 'wallet_addresses'
  | 'lock_wallet_address'
  | 'source_currency'
  | 'source_exchange_amount'
  | 'destination_network'
  | 'destination_currency'
  | 'destination_exchange_amount'
  | 'supported_destination_currencies'
  | 'supported_destination_networks'
>

type StripeCustomerInformation = {
  email?: string
  first_name?: string
  last_name?: string
  dob?: {
    year?: string
    month?: string
    day?: string
  }
  address?: {
    country?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
  }
}

export type StripeDefaultOpenOptions = {
  transaction_details?: StripeTransactionOptions
  customer_information?: StripeCustomerInformation
  customer_ip_address?: string
  customer_wallet_address?: string
}

export type StripeOpenOptions = {
  element: string
  sessionId?: string
  theme?: 'light' | 'dark'
  defaultOptions: StripeDefaultOpenOptions
}

export type StripeEvent = '*' | keyof OnrampUIEventMap
export type StripeEventListener = OnrampUIEventListener<any>
