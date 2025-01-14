import { SafeVersion } from '@safe-global/types-kit'

import { SafeProviderConfig } from './safeProvider'
import { ContractNetworksConfig } from './contracts'

export type SafeAccountConfig = {
  owners: string[]
  threshold: number
  to?: string
  data?: string
  fallbackHandler?: string
  paymentToken?: string
  payment?: number
  paymentReceiver?: string
}

export type DeploymentType = 'canonical' | 'eip155' | 'zksync'

export type SafeDeploymentConfig = {
  saltNonce?: string
  safeVersion?: SafeVersion
  deploymentType?: DeploymentType
}

export type PredictedSafeProps = {
  safeAccountConfig: SafeAccountConfig
  safeDeploymentConfig?: SafeDeploymentConfig
}

type SafeConfigWithSafeAddressProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress: string
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type SafeConfigWithPredictedSafeProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe: PredictedSafeProps
}

export type OnchainAnalyticsProps = {
  /** project - The project that is using the SDK */
  project?: string
  /** platform - The platform that is using the SDK */
  platform?: string
}

export type SafeConfigProps = {
  provider: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
  // on-chain analytics
  onchainAnalytics?: OnchainAnalyticsProps
}

export type SafeConfigWithSafeAddress = SafeConfigProps & SafeConfigWithSafeAddressProps
export type SafeConfigWithPredictedSafe = SafeConfigProps & SafeConfigWithPredictedSafeProps
export type SafeConfig = SafeConfigWithSafeAddress | SafeConfigWithPredictedSafe

type ConnectSafeConfigWithSafeAddressProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: string
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: never
}

type ConnectSafeConfigWithPredictedSafeProps = {
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: never
  /** predictedSafe - The configuration of the Safe that is not yet deployed */
  predictedSafe?: PredictedSafeProps
}

type ConnectSafeConfigProps = {
  provider?: SafeProviderConfig['provider']
  signer?: SafeProviderConfig['signer']
  /** isL1SafeSingleton - Forces to use the Safe L1 version of the contract instead of the L2 version */
  isL1SafeSingleton?: boolean
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
  // on-chain analytics
  onchainAnalytics?: OnchainAnalyticsProps
}

export type ConnectSafeConfigWithSafeAddress = ConnectSafeConfigProps &
  ConnectSafeConfigWithSafeAddressProps
export type ConnectSafeConfigWithPredictedSafe = ConnectSafeConfigProps &
  ConnectSafeConfigWithPredictedSafeProps
export type ConnectSafeConfig =
  | ConnectSafeConfigWithSafeAddress
  | ConnectSafeConfigWithPredictedSafe
