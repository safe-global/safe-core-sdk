import {
  DeploymentFilter,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  SingletonDeployment
} from '@gnosis.pm/safe-deployments'
import { safeDeploymentsL1ChainIds, safeDeploymentsVersions, SafeVersion } from './config'

export function getSafeContractDeployment(
  safeVersion: SafeVersion,
  chainId: number,
  isL1SafeMasterCopy: boolean = false
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeMasterCopyVersion
  const filters: DeploymentFilter = { version, network: chainId.toString(), released: true }
  if (safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeMasterCopy) {
    return getSafeSingletonDeployment(filters)
  }
  return getSafeL2SingletonDeployment(filters)
}

export function getMultiSendContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].multiSendVersion
  return getMultiSendDeployment({ version, network: chainId.toString(), released: true })
}

export function getSafeProxyFactoryContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeProxyFactoryVersion
  return getProxyFactoryDeployment({ version, network: chainId.toString(), released: true })
}
