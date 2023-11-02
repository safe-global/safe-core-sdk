import { LOGIN_PROVIDER_TYPE, TorusParams, UserInfo } from '@web3auth/ws-embed'

export type Web3AuthEvent = 'accountsChanged' | 'chainChanged'
export type Web3AuthInitOptions = TorusParams
export type Web3AuthSignInOptions = {
  loginProvider?: LOGIN_PROVIDER_TYPE
  login_hint?: string
}
export type Web3AuthSignOutOptions = { reset: boolean }
export type Web3AuthUserInfo = UserInfo
export type Web3AuthEventListener = (...args: any[]) => void
export type Web3AuthConfig = {
  txServiceUrl?: string
}
