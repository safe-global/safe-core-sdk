import { EthAdapter } from '@safe-global/safe-core-sdk-types'

export type Web3AuthEvent = string | symbol
export type Web3AuthEventListener = (...args: unknown[]) => void
export type Web3AuthConfig = {
  ethAdapter: EthAdapter
  txServiceUrl?: string
}
