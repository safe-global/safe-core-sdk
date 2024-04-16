import semverSatisfies from 'semver/functions/satisfies'
import {
  SafeContractImplementationType,
  SafeContract_v1_0_0_ImplementationType,
  SafeContract_v1_1_0_ImplementationType,
  SafeContract_v1_2_0_ImplementationType,
  SafeContract_v1_3_0_ImplementationType,
  SafeContract_v1_4_1_ImplementationType
} from '@safe-global/protocol-kit/types'

export enum SAFE_FEATURES {
  SAFE_TX_GAS_OPTIONAL = 'SAFE_TX_GAS_OPTIONAL',
  SAFE_TX_GUARDS = 'SAFE_TX_GUARDS',
  SAFE_FALLBACK_HANDLER = 'SAFE_FALLBACK_HANDLER',
  ETH_SIGN = 'ETH_SIGN',
  ACCOUNT_ABSTRACTION = 'ACCOUNT_ABSTRACTION',
  REQUIRED_TXGAS = 'REQUIRED_TXGAS',
  SIMULATE_AND_REVERT = 'SIMULATE_AND_REVERT'
}

const SAFE_FEATURES_BY_VERSION: Record<SAFE_FEATURES, string> = {
  [SAFE_FEATURES.SAFE_TX_GAS_OPTIONAL]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_TX_GUARDS]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_FALLBACK_HANDLER]: '>=1.1.1',
  [SAFE_FEATURES.ETH_SIGN]: '>=1.1.0',
  [SAFE_FEATURES.ACCOUNT_ABSTRACTION]: '>=1.3.0',
  [SAFE_FEATURES.REQUIRED_TXGAS]: '<=1.2.0',
  [SAFE_FEATURES.SIMULATE_AND_REVERT]: '>=1.3.0'
}

export const hasSafeFeature = (feature: SAFE_FEATURES, version: string): boolean => {
  if (!(feature in SAFE_FEATURES_BY_VERSION)) {
    return false
  }

  return semverSatisfies(version, SAFE_FEATURES_BY_VERSION[feature])
}

export type SafeContractCompatibleWithFallbackHandler =
  | SafeContract_v1_1_0_ImplementationType
  | SafeContract_v1_2_0_ImplementationType
  | SafeContract_v1_3_0_ImplementationType
  | SafeContract_v1_4_1_ImplementationType

export type SafeContractCompatibleWithGuardManager =
  | SafeContract_v1_3_0_ImplementationType
  | SafeContract_v1_4_1_ImplementationType

export type SafeContractCompatibleWithModuleManager =
  | SafeContract_v1_3_0_ImplementationType
  | SafeContract_v1_4_1_ImplementationType

export type SafeContractCompatibleWithRequiredTxGas =
  | SafeContract_v1_0_0_ImplementationType
  | SafeContract_v1_1_0_ImplementationType
  | SafeContract_v1_2_0_ImplementationType

export type SafeContractCompatibleWithSimulateAndRevert =
  | SafeContract_v1_3_0_ImplementationType
  | SafeContract_v1_4_1_ImplementationType

export async function isSafeContractCompatibleWithRequiredTxGas(
  safeContract: SafeContractImplementationType
): Promise<SafeContractCompatibleWithRequiredTxGas> {
  const safeVersion = await safeContract.getVersion()

  if (!hasSafeFeature(SAFE_FEATURES.REQUIRED_TXGAS, safeVersion)) {
    throw new Error('Current version of the Safe does not support the requiredTxGas functionality')
  }

  return safeContract as SafeContractCompatibleWithRequiredTxGas
}

export async function isSafeContractCompatibleWithSimulateAndRevert(
  safeContract: SafeContractImplementationType
): Promise<SafeContractCompatibleWithSimulateAndRevert> {
  const safeVersion = await safeContract.getVersion()

  if (!hasSafeFeature(SAFE_FEATURES.SIMULATE_AND_REVERT, safeVersion)) {
    throw new Error(
      'Current version of the Safe does not support the simulateAndRevert functionality'
    )
  }

  return safeContract as SafeContractCompatibleWithSimulateAndRevert
}
