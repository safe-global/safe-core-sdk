import { SENTINEL_ADDRESS, zeroAddress } from './constants'

export function areAddressesEqual(address1: string, address2: string): boolean {
  return address1.toLowerCase() === address2.toLowerCase()
}

function isZeroAddress(address: string): boolean {
  return address === zeroAddress
}

function isSentinelAddress(address: string): boolean {
  return address === SENTINEL_ADDRESS
}

export function isRestrictedAddress(address: string): boolean {
  return isZeroAddress(address) || isSentinelAddress(address)
}
