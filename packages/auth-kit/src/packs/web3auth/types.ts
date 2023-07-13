export type Web3AuthEvent = string | symbol
export type Web3AuthEventListener = (...args: any[]) => void
export type Web3AuthConfig = {
  txServiceUrl?: string
}
