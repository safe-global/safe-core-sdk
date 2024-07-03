import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

import { SafeClient } from '@safe-global/safe-kit/SafeClient'
import { isValidAddress, isValidSafeConfig } from '@safe-global/safe-kit/utils'
import { SafeKitConfig } from '@safe-global/safe-kit/types'

/**
 * Initializes a Safe client with the given configuration options.
 *
 * @param config - The Safe client configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(config: SafeKitConfig): Promise<SafeClient> {
  const protocolKit = await getProtocolKitInstance(config)
  const apiKit = await getApiKitInstance(protocolKit)

  if (!protocolKit || !apiKit) throw new Error('Failed to create a kit instances')

  return new SafeClient(protocolKit, apiKit)
}

/**
 * Get the Safe protocol kit instance.
 *
 * @param config - The Safe kit configuration options.
 * @returns A protocolKit instance.
 */
async function getProtocolKitInstance(config: SafeKitConfig): Promise<Safe> {
  if (config.safeAddress && isValidAddress(config.safeAddress)) {
    // If the safe already exist
    return Safe.init({
      provider: config.provider,
      signer: config.signer,
      safeAddress: config.safeAddress
    })
  } else if (config.safeOptions && isValidSafeConfig(config.safeOptions)) {
    // If the safe does not exist and the configuration is provided
    const protocolKit = await Safe.init({
      provider: config.provider,
      signer: config.signer,
      predictedSafe: {
        safeAccountConfig: {
          owners: config.safeOptions.owners,
          threshold: config.safeOptions.threshold
        },
        safeDeploymentConfig: {
          saltNonce: config.safeOptions.saltNonce
        }
      }
    })

    const isSafeDeployed = await protocolKit.isSafeDeployed()

    // When the safe is deployed, which can be true given the predicted safe address based on the options,
    // we need to re-initialize the Safe client with the safeAddress
    if (isSafeDeployed) {
      return Safe.init({
        provider: config.provider,
        signer: config.signer,
        safeAddress: await protocolKit.getAddress()
      })
    }

    return protocolKit
  } else {
    throw new Error(
      'Invalid configuration: either a valid safeAddress or valid safeOptions must be provided.'
    )
  }
}

async function getApiKitInstance(protocolKit: Safe): Promise<SafeApiKit> {
  const chainId = await protocolKit.getChainId()

  return new SafeApiKit({ chainId })
}

export * from './types'
export * from './extensions'
export * from './SafeClient'
