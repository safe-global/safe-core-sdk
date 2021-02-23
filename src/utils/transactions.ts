import { zeroAddress, zeroNumber } from './constants'
import { SafeSignature } from './signatures'

export interface SafeTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation: string
  readonly safeTxGas: string
  readonly baseGas: string
  readonly gasPrice: string
  readonly gasToken: string
  readonly refundReceiver: string
  readonly nonce: string
}

interface SafeTransactionDataPartial {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation?: string
  readonly safeTxGas?: string
  readonly baseGas?: string
  readonly gasPrice?: string
  readonly gasToken?: string
  readonly refundReceiver?: string
  readonly nonce: string
}

export interface SafeTransaction {
  data: SafeTransactionData
  signatures: Map<string, SafeSignature>
  dataHash?: string
}

export function makeSafeTransaction({
  to,
  value,
  data,
  operation = zeroNumber,
  safeTxGas = zeroNumber,
  baseGas = zeroNumber,
  gasPrice = zeroNumber,
  gasToken = zeroAddress,
  refundReceiver = zeroAddress,
  nonce
}: SafeTransactionDataPartial): SafeTransaction {
  const safeTransactionData: SafeTransactionData = {
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    nonce
  }
  return {
    data: safeTransactionData,
    signatures: new Map()
  }
}
