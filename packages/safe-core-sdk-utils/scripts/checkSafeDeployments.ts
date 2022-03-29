import { SafeVersion } from '@gnosis.pm/safe-core-sdk-types'
import { DeploymentFilter, getSafeSingletonDeployment } from '@gnosis.pm/safe-deployments'
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
  const safeDeployments = getSafeDeploymentNetworks()
  const localNetworks = getLocalNetworksConfig()
  if (safeDeployments.length !== localNetworks.length) {
    const chainIdsDiff = safeDeployments.filter(chainId => !localNetworks.includes(chainId))
    const errorMessage = `EIP-3770 local config is missing chainIds: ${chainIdsDiff}`
    throw new Error(errorMessage)
  }
}

checkConfigDiff()
