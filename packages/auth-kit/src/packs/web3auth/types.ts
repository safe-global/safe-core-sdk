export type Web3AuthEvent = 'accountsChanged' | 'chainChanged'

export type Web3AuthEventListener = (...args: any[]) => void
export type Web3AuthConfig = {
  txServiceUrl?: string
}
