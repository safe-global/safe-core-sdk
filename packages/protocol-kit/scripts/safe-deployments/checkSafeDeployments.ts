import { getLocalNetworksConfig, getSafeDeploymentNetworks } from './utils'

/**
 * Checks if there are any differences between the local EIP-3770 network configurations and the safe deployment networks.
 *
 * @function checkConfigDiff
 * @returns {void} - nothing, just throws an error if there are any discrepancies
 */
function checkConfigDiff() {
  const safeDeployments = getSafeDeploymentNetworks()
  const localNetworks = getLocalNetworksConfig()

  const chainIdsMissing = safeDeployments.filter((chainId) => !localNetworks.includes(chainId))
  if (chainIdsMissing.length > 0) {
    const errorMessage = `EIP-3770 local config is missing chainIds: ${chainIdsMissing}\nPlease run 'yarn workspace @safe-global/protocol-kit update-safe-deployments`
    throw new Error(errorMessage)
  }

  const chainIdsExtra = localNetworks.filter((chainId) => !safeDeployments.includes(chainId))
  if (chainIdsExtra.length > 0) {
    const errorMessage = `EIP-3770 local config has not required chainIds: ${chainIdsExtra}`
    throw new Error(errorMessage)
  }
}

checkConfigDiff()
