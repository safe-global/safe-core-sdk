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
  SafeVersion,
  SafeWebAuthnSignerFactory_1_4_1_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'

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
    safeWebAuthnSignerFactoryVersion: '1.4.1'
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
    safeWebAuthnSignerFactoryVersion: '1.4.1'
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
    safeWebAuthnSignerFactoryVersion: '1.4.1'
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
    safeWebAuthnSignerFactoryVersion: '1.4.1'
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
    safeWebAuthnSignerFactoryVersion: '1.4.1'
  }
}

export const safeDeploymentsL1ChainIds = [
  1n // Ethereum Mainnet
]

/*
  Some of the contracts used in the PoC app are still experimental, and not included in
  the production deployment packages, thus we need to hardcode their addresses here.
  Deployment commit: https://github.com/safe-global/safe-modules/commit/3853f34f31837e0a0aee47a4452564278f8c62ba
*/
const WEBAUTHN_SIGNER_FACTORY_ADDRESS = '0xc40156AbFEE908E2e3269DA84fa9609bcCDDec60'

const contractFunctions: Record<
  contractName,
  (filter?: DeploymentFilter) => SingletonDeployment | undefined
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
  /*
    safeWebAuthnSignerFactory contract is still experimental, and not included in
    the production deployment packages, thus we need to hardcode the addresses here
  */
  safeWebAuthnSignerFactoryVersion: () => ({
    abi: SafeWebAuthnSignerFactory_1_4_1_ContractArtifacts.abi as unknown as any[],
    defaultAddress: WEBAUTHN_SIGNER_FACTORY_ADDRESS,
    version: '1.4.1',
    contractName: 'safeWebAuthnSignerFactoryVersion',
    networkAddresses: {},
    released: true
  })
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
