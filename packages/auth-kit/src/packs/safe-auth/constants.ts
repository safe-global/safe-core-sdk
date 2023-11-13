import { WalletUrlConfig } from '@web3auth/ws-embed'

export const WALLET_URLS: Record<string, WalletUrlConfig> = {
  testing: {
    url: 'https://safe.web3auth.com',
    logLevel: 'debug'
  },
  development: {
    url: 'http://localhost:4050',
    logLevel: 'debug'
  },
  production: {
    url: 'https://safe.web3auth.com',
    logLevel: 'error'
  }
}
