import { BigNumber } from '@ethersproject/bignumber'
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

// TO-DO: Duplicated. Remove local type and import from "types" package
// {

export interface MetaTransactionOptions {
  gasLimit: BigNumber
  gasToken?: string
  isSponsored?: boolean
}

export interface RelayTransaction {
  target: string
  encodedTransaction: string
  chainId: number
  options: MetaTransactionOptions
}

// import { RelayResponse } from '@gelatonetwork/relay-sdk'
export interface RelayResponse {
  taskId: string
}

// }
// TO-DO: Duplicated. Remove local type and import from "types" package

export interface SafeSetupConfig {
  owners: string[]
  threshold: number
  fallbackHandlerAddress: string
}
