import {
  DeploymentFilter,
  SingletonDeployment,
  SingletonDeploymentV2,
  getCompatibilityFallbackHandlerDeployments,
  getCreateCallDeployments,
  getMultiSendCallOnlyDeployments,
  getMultiSendDeployments,
  getProxyFactoryDeployments,
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments,
  getSignMessageLibDeployments,
  getSimulateTxAccessorDeployments
} from '@safe-global/safe-deployments'
import {
  Deployment,
  getSafeWebAuthnSignerFactoryDeployment,
  getSafeWebAuthnShareSignerDeployment
} from '@safe-global/safe-modules-deployments'
import { SafeVersion } from '@safe-global/types-kit'
import { DeploymentType } from '../types'

export const DEFAULT_SAFE_VERSION: SafeVersion = '1.4.1'
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

export type ContractInfo = {
  version: string
  type: DeploymentType
  contractName: contractName
}

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
    safeWebAuthnSignerFactoryVersion: undefined,
    safeWebAuthnSharedSignerVersion: undefined
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
    safeWebAuthnSignerFactoryVersion: undefined,
    safeWebAuthnSharedSignerVersion: undefined
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
    safeWebAuthnSignerFactoryVersion: undefined,
    safeWebAuthnSharedSignerVersion: undefined
  }
}

export const safeDeploymentsL1ChainIds: bigint[] = [
  // Never use l1 version
]

const contractFunctions: Record<
  contractName,
  (filter?: DeploymentFilter) => SingletonDeploymentV2 | undefined | Deployment
> = {
  safeSingletonVersion: getSafeSingletonDeployments,
  safeSingletonL2Version: getSafeL2SingletonDeployments,
  safeProxyFactoryVersion: getProxyFactoryDeployments,
  compatibilityFallbackHandler: getCompatibilityFallbackHandlerDeployments,
  multiSendVersion: getMultiSendDeployments,
  multiSendCallOnlyVersion: getMultiSendCallOnlyDeployments,
  signMessageLibVersion: getSignMessageLibDeployments,
  createCallVersion: getCreateCallDeployments,
  simulateTxAccessorVersion: getSimulateTxAccessorDeployments,
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

  const deployment = contractFunctions[contractName](filters)

  return deployment
}

export function getContractInfo(contractAddress: string): ContractInfo | undefined {
  for (const [safeVersion, contracts] of Object.entries(safeDeploymentsVersions)) {
    for (const [contractName, contractVersion] of Object.entries(contracts)) {
      const filters: DeploymentFilter = {
        version: contractVersion,
        released: true
      }

      const deployment = contractFunctions[contractName as contractName](
        filters
      ) as SingletonDeployment

      if (deployment && deployment.networkAddresses) {
        for (const [, addresses] of Object.entries(deployment.networkAddresses)) {
          if (
            (Array.isArray(addresses) &&
              addresses.find((a) => a.toLowerCase() === contractAddress.toLowerCase())) ||
            (typeof addresses === 'string' &&
              addresses.toLowerCase() === contractAddress.toLowerCase())
          ) {
            const types = Object.keys(deployment.deployments) as DeploymentType[]

            const type = types.find(
              (t) =>
                deployment.deployments[t]?.address.toLowerCase() === contractAddress.toLowerCase()
            )

            if (type) {
              return {
                version: safeVersion,
                type,
                contractName: contractName as contractName
              }
            }
          }
        }
      }
    }
  }

  return undefined
}
