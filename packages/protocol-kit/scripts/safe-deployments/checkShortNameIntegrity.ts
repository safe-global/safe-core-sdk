import { getChainShortName } from './utils'
import { networks } from '../../src/utils/eip-3770/config'

/**
 * Checks the short names of local EIP-3770 networks to match their corresponding chain short names.
 *
 * @async
 * @function checkShortNameIntegrity
 * @returns {void} - nothing, just prints those chains where the name is not the same.
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

  console.log('Local network configuration checked successfully!')
}

checkShortNameIntegrity()
