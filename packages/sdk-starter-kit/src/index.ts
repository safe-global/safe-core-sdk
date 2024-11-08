import Safe, { SafeConfig } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

import { SafeClient } from '@safe-global/sdk-starter-kit/SafeClient'
import { isValidAddress, isValidSafeConfig } from '@safe-global/sdk-starter-kit/utils'
import { SdkStarterKitConfig } from '@safe-global/sdk-starter-kit/types'
import { DEFAULT_DEPLOYMENT_TYPE } from './constants'

/**
 * Initializes a Safe client with the given configuration options.
 *
 * @param config - The Safe client configuration options.
 * @returns A Safe client instance.
 */
export async function createSafeClient(config: SdkStarterKitConfig): Promise<SafeClient> {
  const protocolKit = await getProtocolKitInstance(config)
  const apiKit = await getApiKitInstance(protocolKit, config)

  if (!protocolKit || !apiKit) throw new Error('Failed to create a kit instances')

  return new SafeClient(protocolKit, apiKit)
}

/**
 * Get the Safe protocol kit instance.
 *
 * @param config - The SDK Starter kit configuration options.
 * @returns A protocolKit instance.
 */
async function getProtocolKitInstance(config: SdkStarterKitConfig): Promise<Safe> {
  if (config.safeAddress && isValidAddress(config.safeAddress)) {
    // If the safe already exist
    return Safe.init({
      provider: config.provider,
      signer: config.signer,
      safeAddress: config.safeAddress
    })
  } else if (config.safeOptions && isValidSafeConfig(config.safeOptions)) {
    // If the safe does not exist and the configuration is provided
    let protocolKit: Safe
    const initConfig: SafeConfig = {
      provider: config.provider,
      signer: config.signer,
      predictedSafe: {
        safeAccountConfig: {
          owners: config.safeOptions.owners,
          threshold: config.safeOptions.threshold
        },
        safeDeploymentConfig: {
          saltNonce: config.safeOptions.saltNonce,
          deploymentType: DEFAULT_DEPLOYMENT_TYPE
        }
      }
    }

    try {
      protocolKit = await Safe.init(initConfig)
    } catch (error) {
      const isDeploymentTypeUnresolvedError =
        error instanceof Error &&
        error.message &&
        error.message.startsWith('Invalid') &&
        error.message.includes('contract address')
      if (
        isDeploymentTypeUnresolvedError &&
        initConfig.predictedSafe.safeDeploymentConfig?.deploymentType
      ) {
        delete initConfig.predictedSafe.safeDeploymentConfig.deploymentType
        protocolKit = await Safe.init(initConfig)
      } else {
        throw error
      }
    }

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

async function getApiKitInstance(
  protocolKit: Safe,
  config: SdkStarterKitConfig
): Promise<SafeApiKit> {
  const chainId = await protocolKit.getChainId()

  return new SafeApiKit({ chainId, txServiceUrl: config.txServiceUrl })
}

export * from './types'
export * from './extensions'
export * from './SafeClient'
