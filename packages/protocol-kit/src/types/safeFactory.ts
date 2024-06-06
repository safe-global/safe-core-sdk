import { SafeVersion, TransactionOptions } from '@safe-global/safe-core-sdk-types'

import { SafeProviderConfig } from './safeProvider'
import { SafeAccountConfig } from './safeConfig'
import { ContractNetworksConfig } from './contracts'

export type DeploySafeProps = {
  safeAccountConfig: SafeAccountConfig
  saltNonce?: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

export type SafeFactoryConfig = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion?: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type SafeFactoryInitConfig = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  privateKeyOrMnemonic?: string
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}
