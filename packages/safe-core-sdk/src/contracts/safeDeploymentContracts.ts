import {
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeSingletonDeployment,
  SingletonDeployment
} from '@gnosis.pm/safe-deployments'

export type SafeVersion = '1.3.0' | '1.2.0' | '1.1.1'

export const SAFE_LAST_VERSION: SafeVersion = '1.3.0'

const safeDeploymentsVersions = {
  '1.3.0': {
    safeMasterCopyVersion: '1.3.0',
    safeProxyFactoryVersion: '1.3.0',
    multiSendVersion: '1.3.0'
  },
  '1.2.0': {
    safeMasterCopyVersion: '1.2.0',
    safeProxyFactoryVersion: '1.1.1',
    multiSendVersion: '1.1.1'
  },
  '1.1.1': {
    safeMasterCopyVersion: '1.1.1',
    safeProxyFactoryVersion: '1.1.1',
    multiSendVersion: '1.1.1'
  }
}

export function getSafeContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeMasterCopyVersion
  return getSafeSingletonDeployment({ version, network: chainId.toString(), released: true })
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
