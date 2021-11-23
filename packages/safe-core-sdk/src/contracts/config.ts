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

export const safeDeploymentsVersions: SafeDeploymentsVersions = {
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

export const safeDeploymentsL1ChainIds = [
  1 // Ethereum Mainnet
]
