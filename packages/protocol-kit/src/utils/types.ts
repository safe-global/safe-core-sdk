import { SafeConfig, SafeConfigWithPredictedSafe } from '../types'
import { getAddress, Address, isHex, Hex, Hash } from 'viem'

export function isSafeConfigWithPredictedSafe(
  config: SafeConfig
): config is SafeConfigWithPredictedSafe {
  return (config as unknown as SafeConfigWithPredictedSafe).predictedSafe !== undefined
}

export function asAddresses(addresses: string[]): Address[] {
  return addresses.map(asAddress)
}

export function asAddress(address: string): Address {
  return getAddress(address)
}

export function asHash(hash: string): Hash {
  return hash as Hash
}

export function asHex(hex?: string): Hex {
  return isHex(hex) ? (hex as Hex) : (`0x${hex}` as Hex)
}
