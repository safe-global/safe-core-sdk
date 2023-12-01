import { LOGIN_PROVIDER_TYPE, WsEmbedParams, UserInfo } from '@web3auth/ws-embed'

export type SafeAuthConfig = {
  txServiceUrl?: string
}
export type SafeAuthInitOptions = Omit<WsEmbedParams, 'walletUrls' | 'chainConfig'> & {
  chainConfig?: SafeAuthProviderConfig
}
export type SafeAuthSignInOptions = {
  loginProvider?: LOGIN_PROVIDER_TYPE
  login_hint?: string
}
export type SafeAuthSignOutOptions = { reset: boolean }
export type SafeAuthUserInfo = UserInfo
export type SafeAuthEvent = 'accountsChanged' | 'chainChanged'
export type SafeAuthEventListener = (...args: any[]) => void

export type SafeAuthProviderConfig = {
  blockExplorerUrl?: string
  logo?: string
  tickerName?: string
  ticker?: string
  rpcTarget: string
  wcTarget?: string
  chainId: string
  displayName?: string
  isTestnet?: boolean
}
