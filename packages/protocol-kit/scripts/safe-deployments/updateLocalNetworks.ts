import fs from 'fs'
import { getChainShortName, getLocalNetworksConfig, getSafeDeploymentNetworks } from './utils'
import { networks } from '../../src/utils/eip-3770/config'

interface NetworkShortName {
  shortName: string
  chainId: bigint
}

/**
 * Updates the local networks array in the configuration file.
 *
 * @param {NetworkShortName[]} networks - The full list of networks.
 */

function updateLocalNetworks(networks: NetworkShortName[]) {
  const path = 'src/utils/eip-3770/config.ts'

  fs.readFile(path, (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    const content = data.toString()
    const startIndex =
      content.indexOf('export const networks: NetworkShortName[] = [') +
      'export const networks: NetworkShortName[] = ['.length
    const endIndex = content.indexOf(']\n\nif (process.env.TEST_NETWORK ===')

    const sortedNetworks = networks
      .sort((a, b) => Number(a.chainId - b.chainId))
      .map(
        (network, index) =>
          `  { chainId: ${network.chainId}n, shortName: '${network.shortName}' }${index === networks.length - 1 ? '' : ','}`
      )
      .join('\n')

    fs.writeFile(
      path,
      `${content.substring(0, startIndex)}\n${sortedNetworks}\n${content.substring(endIndex)}`,
      (err) => {
        if (err) {
          console.error(err)
        } else {
          console.log('Networks array updated successfully!')
        }
      }
    )
  })
}

/**
 * Checks and updates the local networks configuration file.
 */
async function checkAndUpdate() {
  const safeDeployments = getSafeDeploymentNetworks()
  const localNetworks = getLocalNetworksConfig()

  const chainIdsMissing = safeDeployments.filter((chainId) => !localNetworks.includes(chainId))
  if (chainIdsMissing.length > 0) {
    const updateNetworks = [...networks]
    for (const chainId of chainIdsMissing) {
      try {
        const shortName = await getChainShortName(chainId)
        console.log(`Adding ${chainId} with shortName ${shortName}`)
        updateNetworks.push({ chainId: BigInt(chainId), shortName: shortName })
      } catch (error) {
        throw new Error(`EIP-3770 Failed to retrieve chain name for ${chainId}`)
      }
    }

    updateLocalNetworks(updateNetworks)
  }
}

checkAndUpdate()
