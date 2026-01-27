import { getChainShortName, checkForDuplicateShortNames, formatDuplicateReport } from './utils'
import { networks } from '../../src/utils/eip-3770/config'

/**
 * Checks the short names of local EIP-3770 networks to match their corresponding chain short names from external sources.
 * Compares local configuration with ethereum-lists and DefiLlama data to identify mismatches.
 *
 * @async
 * @function checkShortNameIntegrity
 * @returns {Promise<void>} - Logs any chains where local shortName differs from external sources
 */
async function checkShortNameIntegrity() {
  for (const network of networks) {
    try {
      const shortName = await getChainShortName(network.chainId.toString())
      if (network.shortName !== shortName) {
        // It just prints the chain that is not aligned so we can check if manual action is necessary.
        console.log(`Update ${network.chainId} from '${network.shortName}' to '${shortName}'`)
      }
    } catch (error) {
      console.log(`EIP-3770 Failed to retrieve chain name for ${network.chainId}`)
    }
  }
}

/**
 * Checks for duplicate shortNames in the local EIP-3770 network configurations.
 * Logs warnings for any shortNames that are used by multiple chainIds.
 *
 * @function checkDuplicateShortNames
 * @returns {void} - Logs warnings if duplicate shortNames are found
 */
function checkDuplicateShortNames() {
  const duplicateCheck = checkForDuplicateShortNames(networks)
  if (duplicateCheck.hasDuplicates) {
    console.log('\n⚠️  WARNING: ' + formatDuplicateReport(duplicateCheck.duplicates))
    console.log('\nThese duplicates must be resolved manually.\n')
  }
}

/**
 * Main execution: runs all validation checks sequentially.
 */
async function runChecks() {
  await checkShortNameIntegrity()
  checkDuplicateShortNames()
  console.log('Local network configuration checked successfully!')
}

runChecks()
