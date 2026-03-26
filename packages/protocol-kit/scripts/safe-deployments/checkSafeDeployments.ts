import {
  getLocalNetworksConfig,
  getSafeDeploymentNetworks,
  checkForDuplicateShortNames,
  formatDuplicateReport
} from './utils'
import { networks } from '../../src/utils/eip-3770/config'

/**
 * Checks if there are any differences between the local EIP-3770 network configurations and the safe deployment networks.
 * Specifically validates that all required chainIds are present and no extra chainIds exist.
 *
 * @function checkConfigDiff
 * @returns {void} - Throws an error if there are chainId mismatches
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

/**
 * Checks for duplicate shortNames in the local EIP-3770 network configurations.
 * This validation ensures that each shortName uniquely identifies a single chainId.
 *
 * @function checkDuplicateShortNames
 * @returns {void} - Throws an error if duplicate shortNames are found
 */
function checkDuplicateShortNames() {
  const duplicateCheck = checkForDuplicateShortNames(networks)
  if (duplicateCheck.hasDuplicates) {
    const errorMessage = `${formatDuplicateReport(duplicateCheck.duplicates)}\n\nPlease resolve these conflicts manually before building.`
    throw new Error(errorMessage)
  }
}

// Run all validation checks
checkConfigDiff()
checkDuplicateShortNames()
