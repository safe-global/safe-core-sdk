import { validateEthereumAddress } from '@safe-global/protocol-kit'
import { SafeConfig } from '../types'

export const isValidAddress = (address: string): boolean => {
  try {
    validateEthereumAddress(address)
    return true
  } catch {
    return false
  }
}

export const isValidSafeConfig = (config: SafeConfig): boolean => {
  if (!config.owners || !config.threshold) return false

  return true
}

export * from './sendTransaction'
export * from './sendAndDeployTransaction'
