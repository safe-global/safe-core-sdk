import { DeploymentFilter, getSafeSingletonDeployment } from '@aaron-roe/safe-deployments-shimmer'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { networks } from '../src/eip-3770/config'

const safeVersion: SafeVersion = '1.3.0'

function getSafeDeploymentNetworks(): string[] {
  const filters: DeploymentFilter = { version: safeVersion, released: true }
  const singletons = getSafeSingletonDeployment(filters)
  if (!singletons) {
    throw new Error('Empty Safe Deployments')
  }
  return Object.keys(singletons.networkAddresses)
}

function getLocalNetworksConfig(): string[] {
  return networks.map(network => network.chainId.toString())
}

function checkConfigDiff() {
  const safeDeployments = getSafeDeploymentNetworks().filter(chainId => ![18,39,1101,1111,1112,1115,1116,3737,5001,23294,23295,59140,534353,245022926].includes(+chainId))
  const localNetworks = getLocalNetworksConfig()
  if (safeDeployments.length !== localNetworks.length) {
    const chainIdsDiff = safeDeployments.filter(chainId => !localNetworks.includes(chainId))
    const errorMessage = `EIP-3770 local config is missing chainIds: ${chainIdsDiff}`
    throw new Error(errorMessage)
  }
}

checkConfigDiff()
