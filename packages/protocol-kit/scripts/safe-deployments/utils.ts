import axios from 'axios'
import { SafeVersion } from '@safe-global/types-kit'
import { DeploymentFilter, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { networks } from '../../src/utils/eip-3770/config'

/**
 * Array of compatible Safe versions.
 */
const compatibleSafeVersions: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

/**
 * Interface for chain data from chainlist.org
 */
type ChainData = {
  name: string
  chain: string
  shortName: string
  chainId: number
  networkId: number
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpc: Array<{ url: string }>
  faucets: string[]
  infoURL: string
  slip44?: number
}

/**
 * Cache for chainlist.org data to avoid multiple API calls during script execution.
 */
let chainListCache: ChainData[] | null = null

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
 * Retrieves the chain shortName for a given chain ID from ethereum-lists repo.
 *
 * @param {string} chainId The chain ID to retrieve the name for
 * @returns {Promise<string>} A promise that resolves with the chain shortName
 */
async function getChainShortNameFromEthereumLists(chainId: string): Promise<string> {
  let url: string

  switch (chainId) {
    case '81224':
      url =
        'https://raw.githubusercontent.com/JasonwLi/chains/435863dabe1152380a6f9a02721aedfd2a237ad9/_data/chains/eip155-81224.json'
      break
    default:
      url = `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${chainId.toString()}.json`
  }

  const response = await axios.get(url)

  if (!response.data.shortName) {
    throw new Error('Failed to retrieve chain shortName from ethereum-lists')
  }
  return response.data.shortName
}

/**
 * Retrieves the chain shortName for a given chain ID from DefiLlama's chainlist.
 *
 * @param {string} chainId The chain ID to retrieve the name for
 * @returns {Promise<string>} A promise that resolves with the chain shortName
 */
async function getChainShortNameFromDefiLlama(chainId: string): Promise<string> {
  // Check if data is already cached
  if (!chainListCache) {
    const response = await axios.get('https://chainlist.org/rpcs.json')

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Failed to retrieve chain data from DefiLlama or data is not an array')
    }

    // Cache the response data
    chainListCache = response.data
  }

  // Search for the chain with the matching chainId
  const chainIdNumber = parseInt(chainId, 10)
  const chainData = chainListCache.find((chain) => chain.chainId === chainIdNumber)

  if (!chainData || !chainData.shortName) {
    throw new Error(`Chain with ID ${chainId} not found or missing shortName in DefiLlama data`)
  }

  return chainData.shortName
}

/**
 * Retrieves the chain shortName for a given chain ID.
 * Tries DefiLlama first, then fallback to ethereum-lists if not found.
 *
 * @param {string} chainId The chain ID to retrieve the name for
 * @returns {Promise<string>} A promise that resolves with the chain shortName
 */
export async function getChainShortName(chainId: string): Promise<string> {
  try {
    // Try DefiLlama first
    return await getChainShortNameFromDefiLlama(chainId)
  } catch (error) {
    // If DefiLlama fails, try ethereum-lists as fallback
    try {
      return await getChainShortNameFromEthereumLists(chainId)
    } catch (fallbackError) {
      // If both fail, throw a comprehensive error
      throw new Error(
        `Failed to retrieve chain shortName for ${chainId} from both providers. ` +
          `DefiLlama error: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          `Ethereum-lists error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}.`
      )
    }
  }
}
