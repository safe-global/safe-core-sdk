import { SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { Address, Hash } from 'viem'

export function toBigInt(value: string | number | bigint | null | undefined) {
  if (value == null) return undefined
  return BigInt(value)
}

export function formatViemSafeTransactionData(data: SafeTransactionData) {
  return {
    to: data.to as Address,
    value: BigInt(data.value),
    data: data.data as Hash,
    operation: data.operation,
    safeTxGas: BigInt(data.safeTxGas),
    baseGas: BigInt(data.baseGas),
    gasPrice: BigInt(data.gasPrice),
    gasToken: data.gasToken as Address,
    refundReceiver: data.refundReceiver as Address,
    nonce: BigInt(data.nonce)
  }
}
