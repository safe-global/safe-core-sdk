import { SafeVersion, TransactionOptions } from '@safe-global/safe-core-sdk-types'

import { SafeProviderConfig } from './safeProvider'
import { SafeAccountConfig } from './safeConfig'
import { ContractNetworksConfig } from './contracts'
import { PasskeyArgType } from './passkeys'

export type DeploySafeProps = {
  safeAccountConfig: SafeAccountConfig
  saltNonce?: string
  options?: TransactionOptions
  callback?: (txHash: string) => void
}

export type SafeFactoryConfig = {
  provider: SafeProviderConfig['provider']
  signer?: string | PasskeyArgType
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion?: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export type SafeFactoryInitConfig = {
  provider: SafeProviderConfig['provider']
  signer?: string | PasskeyArgType
  privateKeyOrMnemonic?: string
  /** safeVersion - Versions of the Safe deployed by this Factory contract */
  safeVersion: SafeVersion
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}
