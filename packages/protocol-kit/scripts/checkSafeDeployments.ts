import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { DeploymentFilter, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { networks } from '../src/utils/eip-3770/config'

// TO-DO: The SDK needs to take into account all the networks where the different versions of the Safe contracts are deployed, not just the ones for v1.3.0 contracts
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
  return networks.map((network: any) => network.chainId.toString())
}

function checkConfigDiff() {
  const safeDeployments = getSafeDeploymentNetworks()
  const localNetworks = getLocalNetworksConfig()

  const chainIdsMissingDiff = safeDeployments.filter((chainId) => !localNetworks.includes(chainId))
  if (chainIdsMissingDiff.length > 0) {
    const errorMessage = `EIP-3770 local config is missing chainIds: ${chainIdsMissingDiff}`
    throw new Error(errorMessage)
  }

  const chainIdsExtraDiff = localNetworks.filter((chainId) => !safeDeployments.includes(chainId))
  if (chainIdsExtraDiff.length > 0) {
    const errorMessage = `EIP-3770 local config are not required chainIds: ${chainIdsExtraDiff}`
    throw new Error(errorMessage)
  }
}

checkConfigDiff()
