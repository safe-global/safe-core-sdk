import { ExternalProvider } from '@ethersproject/providers'

import { Web3AuthEvent, Web3AuthEventListener } from './packs/web3auth/types'
import { Web3AuthAdapter } from './packs/web3auth/Web3AuthAdapter'

export interface SafeAuthSignInData {
  eoa: string
  safes?: string[]
}

export interface SafeAuthAdapter<TAdapter> {
  provider: ExternalProvider | null
  init(): Promise<void>
  signIn(): Promise<SafeSignInResponse<TAdapter>>
  signOut(): Promise<void>
  subscribe(event: SafeAuthEvent<TAdapter>, handler: SafeAuthEventListener<TAdapter>): void
  unsubscribe(event: SafeAuthEvent<TAdapter>, handler: SafeAuthEventListener<TAdapter>): void
}

export interface ISafeAuthKit<TAdapter> {
  signIn(): Promise<SafeAuthSignInData>
  signOut(): Promise<void>
  getProvider(): ExternalProvider | null
  subscribe(event: SafeAuthEvent<TAdapter>, listener: SafeAuthEventListener<TAdapter>): void
  unsubscribe(event: SafeAuthEvent<TAdapter>, listener: SafeAuthEventListener<TAdapter>): void
}

export type SafeAuthEvent<T> = T extends Web3AuthAdapter ? Web3AuthEvent : never
export type SafeAuthEventListener<T> = T extends Web3AuthAdapter ? Web3AuthEventListener : never
export type SafeSignInResponse<T> = T extends Web3AuthAdapter ? void : never

export interface SafeAuthConfig {
  txServiceUrl?: string
}
