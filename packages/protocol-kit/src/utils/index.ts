import {
  MetaTransactionData,
  SafeMultisigTransactionResponse,
  SafeTransaction,
  SafeTransactionDataPartial
} from '@safe-global/safe-core-sdk-types'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from './constants'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export function isZeroAddress(address: string): boolean {
  return sameString(address, ZERO_ADDRESS)
}

function isSentinelAddress(address: string): boolean {
  return sameString(address, SENTINEL_ADDRESS)
}

export function isRestrictedAddress(address: string): boolean {
  return isZeroAddress(address) || isSentinelAddress(address)
}

export function isMetaTransactionArray(
  safeTransactions: SafeTransactionDataPartial | MetaTransactionData[]
): safeTransactions is MetaTransactionData[] {
  return (safeTransactions as MetaTransactionData[])?.length !== undefined
}

export function isSafeMultisigTransactionResponse(
  safeTransaction: SafeTransaction | SafeMultisigTransactionResponse
): safeTransaction is SafeMultisigTransactionResponse {
  return (safeTransaction as SafeMultisigTransactionResponse).isExecuted !== undefined
}
