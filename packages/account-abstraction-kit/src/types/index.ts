import { RelayPack } from '@safe-global/relay-kit'

export enum OperationType {
  Call,
  DelegateCall
}

export interface AccountAbstractionConfig {
  relayPack: RelayPack
}
