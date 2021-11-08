import {
  DeploymentFilter,
  getMultiSendDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  SingletonDeployment
} from '@gnosis.pm/safe-deployments'

export type SafeVersion = '1.3.0' | '1.2.0' | '1.1.1'

export const SAFE_LAST_VERSION: SafeVersion = '1.3.0'
export const SAFE_BASE_VERSION: SafeVersion = '1.1.1'

type SafeDeploymentsVersions = {
  [version: string]: {
    safeMasterCopyVersion: string
    safeMasterCopyL2Version: string | undefined
    safeProxyFactoryVersion: string
    multiSendVersion: string
  }
}

const safeDeploymentsVersions: SafeDeploymentsVersions = {
  '1.3.0': {
    safeMasterCopyVersion: '1.3.0',
    safeMasterCopyL2Version: '1.3.0',
    safeProxyFactoryVersion: '1.3.0',
    multiSendVersion: '1.3.0'
  },
  '1.2.0': {
    safeMasterCopyVersion: '1.2.0',
    safeMasterCopyL2Version: undefined,
    safeProxyFactoryVersion: '1.1.1',
    multiSendVersion: '1.1.1'
  },
  '1.1.1': {
    safeMasterCopyVersion: '1.1.1',
    safeMasterCopyL2Version: undefined,
    safeProxyFactoryVersion: '1.1.1',
    multiSendVersion: '1.1.1'
  }
}

const safeDeploymentsL1ChainIds = [
  1, // Ethereum Mainnet
  4, // Ethereum Testnet Rinkeby
  5, // Ethereum Testnet Goerli
  42 // Ethereum Testnet Kovan
]

/*
const safeDeploymentsL2ChainIds = [
  56, // Binance Smart Chain Mainnet
  100, // xDAI Chain
  137, // Polygon Mainnet
  246, // Energy Web Chain
  42161, // Arbitrum One
  73799, // Energy Web Volta Testnet

  69, // Optimistic Ethereum Network
  1285, // Moonriver
  1287, // Moonbase Alpha
  4002, // Fantom Testnet
  42220, // Celo Mainnet
  43114, // Avalanche Mainnet
  333999 // Polis Mainnet
]
*/

export function getSafeContractDeployment(
  safeVersion: SafeVersion,
  chainId: number
): SingletonDeployment | undefined {
  const version = safeDeploymentsVersions[safeVersion].safeMasterCopyVersion
  const filters: DeploymentFilter = { version, network: chainId.toString(), released: true }
  if (safeDeploymentsL1ChainIds.includes(chainId)) {
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
