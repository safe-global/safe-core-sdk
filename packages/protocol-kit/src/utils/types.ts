import { Signer, Provider } from 'ethers'
import { SafeConfig, SafeConfigWithPredictedSafe } from '../types'

export function isSafeConfigWithPredictedSafe(
  config: SafeConfig
): config is SafeConfigWithPredictedSafe {
  return (config as unknown as SafeConfigWithPredictedSafe).predictedSafe !== undefined
}

/**
 * Check if the signerOrProvider is compatible with `Signer`
 * @param signerOrProvider - Signer or provider
 * @returns true if the parameter is compatible with `Signer`
 */
export function isSignerCompatible(signerOrProvider: Signer | Provider): boolean {
  const candidate = signerOrProvider as Signer

  const isSigntransactionCompatible = typeof candidate.signTransaction === 'function'
  const isSignMessageCompatible = typeof candidate.signMessage === 'function'
  const isGetAddressCompatible = typeof candidate.getAddress === 'function'

  return isSigntransactionCompatible && isSignMessageCompatible && isGetAddressCompatible
}
