import { Eip3770Address } from '@safe-global/safe-core-sdk-types'
import { isAddress, isHexStrict } from 'web3-utils'
import { networks } from './config'

export function parseEip3770Address(fullAddress: string): Eip3770Address {
  const parts = fullAddress.split(':')
  const address = parts.length > 1 ? parts[1] : parts[0]
  const prefix = parts.length > 1 ? parts[0] : ''
  return { prefix, address }
}

export function getEip3770NetworkPrefixFromChainId(chainId: number): string {
  const network = networks.find((network) => chainId === network.chainId)
  if (!network) {
    throw new Error('No network prefix supported for the current chainId')
  }
  return network.shortName
}

export function isValidEip3770NetworkPrefix(prefix: string): boolean {
  return networks.some(({ shortName }) => shortName === prefix)
}

export function validateEip3770NetworkPrefix(prefix: string, currentChainId: number): void {
  const isCurrentNetworkPrefix = prefix === getEip3770NetworkPrefixFromChainId(currentChainId)
  if (!isValidEip3770NetworkPrefix(prefix) || !isCurrentNetworkPrefix) {
    throw new Error('The network prefix must match the current network')
  }
}

export function validateEthereumAddress(address: string): void {
  const isValidAddress = isHexStrict(address) && isAddress(address)
  if (!isValidAddress) {
    throw new Error(`Invalid Ethereum address ${address}`)
  }
}

export function validateEip3770Address(
  fullAddress: string,
  currentChainId: number
): Eip3770Address {
  const { address, prefix } = parseEip3770Address(fullAddress)
  validateEthereumAddress(address)
  if (prefix) {
    validateEip3770NetworkPrefix(prefix, currentChainId)
  }
  return { address, prefix }
}
