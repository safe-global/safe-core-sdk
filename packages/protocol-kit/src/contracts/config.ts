import {
  DeploymentFilter,
  SingletonDeployment,
  getCompatibilityFallbackHandlerDeployment,
  getCreateCallDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  getSignMessageLibDeployment,
  getSimulateTxAccessorDeployment
} from '@safe-global/safe-deployments'
import {
  Deployment,
  getSafeWebAuthnSignerFactoryDeployment,
  getSafeWebAuthnShareSignerDeployment
} from '@safe-global/safe-modules-deployments'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

export const DEFAULT_SAFE_VERSION: SafeVersion = '1.3.0'
export const SAFE_BASE_VERSION: SafeVersion = '1.0.0'

type contractNames = {
  safeSingletonVersion: string
  safeSingletonL2Version?: string
  safeProxyFactoryVersion: string
  compatibilityFallbackHandler: string
  multiSendVersion: string
  multiSendCallOnlyVersion?: string
  signMessageLibVersion?: string
  createCallVersion?: string
  simulateTxAccessorVersion?: string
  safeWebAuthnSignerFactoryVersion?: string
  safeWebAuthnSharedSignerVersion?: string
}

type SafeDeploymentsVersions = Record<SafeVersion, contractNames>

export type contractName = keyof contractNames

export const safeDeploymentsVersions: SafeDeploymentsVersions = {
  '1.4.1': {
    safeSingletonVersion: '1.4.1',
    safeSingletonL2Version: '1.4.1',
    safeProxyFactoryVersion: '1.4.1',
    compatibilityFallbackHandler: '1.4.1',
    multiSendVersion: '1.4.1',
    multiSendCallOnlyVersion: '1.4.1',
    signMessageLibVersion: '1.4.1',
    createCallVersion: '1.4.1',
    simulateTxAccessorVersion: '1.4.1',
    safeWebAuthnSignerFactoryVersion: '0.2.1',
    safeWebAuthnSharedSignerVersion: '0.2.1'
  },
  '1.3.0': {
    safeSingletonVersion: '1.3.0',
    safeSingletonL2Version: '1.3.0',
    safeProxyFactoryVersion: '1.3.0',
    compatibilityFallbackHandler: '1.3.0',
    multiSendVersion: '1.3.0',
    multiSendCallOnlyVersion: '1.3.0',
    signMessageLibVersion: '1.3.0',
    createCallVersion: '1.3.0',
    simulateTxAccessorVersion: '1.3.0',
    safeWebAuthnSignerFactoryVersion: '0.2.1',
    safeWebAuthnSharedSignerVersion: '0.2.1'
  },
  '1.2.0': {
    safeSingletonVersion: '1.2.0',
    safeSingletonL2Version: undefined,
    safeProxyFactoryVersion: '1.1.1',
    compatibilityFallbackHandler: '1.3.0',
    multiSendVersion: '1.1.1',
    multiSendCallOnlyVersion: '1.3.0',
    signMessageLibVersion: '1.3.0',
    createCallVersion: '1.3.0',
    safeWebAuthnSignerFactoryVersion: '0.2.1',
    safeWebAuthnSharedSignerVersion: '0.2.1'
  },
  '1.1.1': {
    safeSingletonVersion: '1.1.1',
    safeSingletonL2Version: undefined,
    safeProxyFactoryVersion: '1.1.1',
    compatibilityFallbackHandler: '1.3.0',
    multiSendVersion: '1.1.1',
    multiSendCallOnlyVersion: '1.3.0',
    signMessageLibVersion: '1.3.0',
    createCallVersion: '1.3.0',
    safeWebAuthnSignerFactoryVersion: '0.2.1',
    safeWebAuthnSharedSignerVersion: '0.2.1'
  },
  '1.0.0': {
    safeSingletonVersion: '1.0.0',
    safeSingletonL2Version: undefined,
    safeProxyFactoryVersion: '1.0.0',
    compatibilityFallbackHandler: '1.3.0',
    multiSendVersion: '1.1.1',
    multiSendCallOnlyVersion: '1.3.0',
    signMessageLibVersion: '1.3.0',
    createCallVersion: '1.3.0',
    safeWebAuthnSignerFactoryVersion: '0.2.1',
    safeWebAuthnSharedSignerVersion: '0.2.1'
  }
}

export const safeDeploymentsL1ChainIds = [
  1n // Ethereum Mainnet
]

const contractFunctions: Record<
  contractName,
  (filter?: DeploymentFilter) => SingletonDeployment | undefined | Deployment
> = {
  safeSingletonVersion: getSafeSingletonDeployment,
  safeSingletonL2Version: getSafeL2SingletonDeployment,
  safeProxyFactoryVersion: getProxyFactoryDeployment,
  compatibilityFallbackHandler: getCompatibilityFallbackHandlerDeployment,
  multiSendVersion: getMultiSendDeployment,
  multiSendCallOnlyVersion: getMultiSendCallOnlyDeployment,
  signMessageLibVersion: getSignMessageLibDeployment,
  createCallVersion: getCreateCallDeployment,
  simulateTxAccessorVersion: getSimulateTxAccessorDeployment,
  safeWebAuthnSignerFactoryVersion: getSafeWebAuthnSignerFactoryDeployment,
  safeWebAuthnSharedSignerVersion: getSafeWebAuthnShareSignerDeployment
}

export function getContractDeployment(
  safeVersion: SafeVersion,
  chainId: bigint,
  contractName: contractName
) {
  const contractVersion = safeDeploymentsVersions[safeVersion][contractName]

  const filters: DeploymentFilter = {
    version: contractVersion,
    network: chainId.toString(),
    released: true
  }

  const deployment = contractFunctions[contractName](filters) as SingletonDeployment

  return deployment
}
