import { Chain, Network } from '@monerium/sdk'

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
