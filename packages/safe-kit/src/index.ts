import Safe from '@safe-global/protocol-kit'
import { SafeKitConfig } from './types'
import { SafeClient } from './SafeClient'
import { isValidAddress, isValidSafeConfig } from './utils'

/**
 * Initializes a Safe client with the given configuration options.
 *
 * @param config - The Safe client configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(config: SafeKitConfig): Promise<SafeClient> {
  const protocolKit = await getProtocolKitInstance(config)
  if (!protocolKit) throw new Error('Failed to create a protocol-kit instance')

  return new SafeClient(protocolKit)
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

export * from './types'
