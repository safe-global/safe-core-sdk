import { ExternalProvider } from '@ethersproject/providers'

import { Web3AuthEvent, Web3AuthEventListener } from './packs/web3auth/types'
import { Web3AuthModalPack } from './packs/web3auth/Web3AuthModalPack'

export interface SafeAuthSignInData {
  eoa: string
  safes?: string[]
}

export interface SafeAuthPack<TPack> {
  provider: ExternalProvider | null
  init(): Promise<void>
  signIn(): Promise<SafeSignInResponse<TPack>>
  signOut(): Promise<void>
  subscribe(event: SafeAuthEvent<TPack>, handler: SafeAuthEventListener<TPack>): void
  unsubscribe(event: SafeAuthEvent<TPack>, handler: SafeAuthEventListener<TPack>): void
}

export interface ISafeAuthKit<TPack> {
  signIn(): Promise<SafeAuthSignInData>
  signOut(): Promise<void>
  getProvider(): ExternalProvider | null
  subscribe(event: SafeAuthEvent<TPack>, listener: SafeAuthEventListener<TPack>): void
  unsubscribe(event: SafeAuthEvent<TPack>, listener: SafeAuthEventListener<TPack>): void
}

export type SafeAuthEvent<TPack> = TPack extends Web3AuthModalPack ? Web3AuthEvent : never
export type SafeAuthEventListener<TPack> = TPack extends Web3AuthModalPack
  ? Web3AuthEventListener
  : never
export type SafeSignInResponse<TPack> = TPack extends Web3AuthModalPack ? void : never

export interface SafeAuthConfig {
  txServiceUrl?: string
}
