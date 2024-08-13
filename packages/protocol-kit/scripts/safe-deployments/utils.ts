import axios from 'axios'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { DeploymentFilter, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { networks } from '../../src/utils/eip-3770/config'

/**
 * Array of compatible Safe versions.
 */
const compatibleSafeVersions: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

/**
 * Gets the network IDs where the Safe smart contracts were deployed and added to @safe-global/safe-deployments.
 *
 * @returns {string[]} Array of network IDs
 */
export function getSafeDeploymentNetworks(): string[] {
  const allDeployedNetworks = compatibleSafeVersions.reduce((acc: string[], safeVersion) => {
    const filters: DeploymentFilter = { version: safeVersion, released: true }
    const singletons = getSafeSingletonDeployment(filters)

    if (!singletons) {
      return acc
    }

    return acc.concat(Object.keys(singletons.networkAddresses))
  }, [])

  const uniqueDeployedNetworks = [...new Set(allDeployedNetworks)]

  if (!uniqueDeployedNetworks) {
    throw new Error('Empty Safe Deployments')
  }
  return uniqueDeployedNetworks
}

/**
 * Gets the local EIP-3770 network configurations.
 *
 * @returns {string[]} Array of network IDs
 */
export function getLocalNetworksConfig(): string[] {
  return networks.map((network) => network.chainId.toString())
}

/**
 * Retrieves the chain shortName for a given chain ID from the Ethereum Lists repo.
 *
 * @param {string} chainId The chain ID to retrieve the name for
 * @returns {Promise<string>} A promise that resolves with the chain shortName
 */
export async function getChainShortName(chainId: string): Promise<string> {
  const response = await axios.get(
    `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${chainId.toString()}.json`
  )
  if (!response.data.shortName) {
    throw new Error('Failed to retrieve chain shortName')
  }
  return response.data.shortName
}
