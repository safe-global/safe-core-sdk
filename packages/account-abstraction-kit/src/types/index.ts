import { RelayAdapter } from '@safe-global/relay-kit'

export enum OperationType {
  Call,
  DelegateCall
}

export interface AccountAbstractionConfig {
  relayAdapter: RelayAdapter
}

export interface MetaTransactionData {
  to: string
  value: string
  data: string
  operation?: OperationType
}

export interface SafeTransactionData extends MetaTransactionData {
  operation: OperationType
  safeTxGas: number
  baseGas: number
  gasPrice: number
  gasToken: string
  refundReceiver: string
  nonce: number
}

export interface SafeSetupConfig {
  owners: string[]
  threshold: number
  fallbackHandlerAddress: string
}
