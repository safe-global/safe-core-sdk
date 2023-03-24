import { RelayAdapter } from '@safe-global/relay-kit'

export enum OperationType {
  Call,
  DelegateCall
}

export interface AccountAbstractionConfig {
  relayAdapter: RelayAdapter
}
