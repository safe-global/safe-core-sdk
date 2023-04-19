import { Chain, Network } from '@monerium/sdk'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'

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
