import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { DeploymentFilter, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { networks } from '../src/utils/eip-3770/config'

const compatibleSafeVersions: SafeVersion[] = ['1.0.0', '1.1.1', '1.2.0', '1.3.0', '1.4.1']

function getSafeDeploymentNetworks(): string[] {
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

function getLocalNetworksConfig(): string[] {
  return networks.map((network) => network.chainId.toString())
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
