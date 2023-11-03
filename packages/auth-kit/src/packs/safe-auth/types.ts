import { LOGIN_PROVIDER_TYPE, TorusParams, UserInfo } from '@web3auth/ws-embed'

export type SafeAuthEvent = 'accountsChanged' | 'chainChanged'
export type SafeAuthInitOptions = TorusParams
export type SafeAuthSignInOptions = {
  loginProvider?: LOGIN_PROVIDER_TYPE
  login_hint?: string
}
export type SafeAuthSignOutOptions = { reset: boolean }
export type SafeAuthUserInfo = UserInfo
export type SafeAuthEventListener = (...args: any[]) => void
export type SafeAuthConfig = {
  txServiceUrl?: string
}
