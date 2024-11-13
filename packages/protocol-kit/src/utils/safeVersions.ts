import semverSatisfies from 'semver/functions/satisfies'
import { SafeContractImplementationType } from '@safe-global/protocol-kit/types'
import SafeContract_v1_0_0 from '@safe-global/protocol-kit/contracts/Safe/v1.0.0/SafeContract_v1_0_0'
import SafeContract_v1_1_1 from '@safe-global/protocol-kit/contracts/Safe/v1.1.1/SafeContract_v1_1_1'
import SafeContract_v1_2_0 from '@safe-global/protocol-kit/contracts/Safe/v1.2.0/SafeContract_v1_2_0'
import SafeContract_v1_3_0 from '@safe-global/protocol-kit/contracts/Safe/v1.3.0/SafeContract_v1_3_0'
import SafeContract_v1_4_1 from '@safe-global/protocol-kit/contracts/Safe/v1.4.1/SafeContract_v1_4_1'

export enum SAFE_FEATURES {
  SAFE_TX_GAS_OPTIONAL = 'SAFE_TX_GAS_OPTIONAL',
  SAFE_TX_GUARDS = 'SAFE_TX_GUARDS',
  SAFE_FALLBACK_HANDLER = 'SAFE_FALLBACK_HANDLER',
  ETH_SIGN = 'ETH_SIGN',
  ACCOUNT_ABSTRACTION = 'ACCOUNT_ABSTRACTION',
  REQUIRED_TXGAS = 'REQUIRED_TXGAS',
  SIMULATE_AND_REVERT = 'SIMULATE_AND_REVERT',
  PASSKEY_SIGNER = 'PASSKEY_SIGNER',
  SAFE_L2_CONTRACTS = 'SAFE_L2_CONTRACTS'
}

const SAFE_FEATURES_BY_VERSION: Record<SAFE_FEATURES, string> = {
  [SAFE_FEATURES.SAFE_TX_GAS_OPTIONAL]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_TX_GUARDS]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_FALLBACK_HANDLER]: '>=1.1.1',
  [SAFE_FEATURES.ETH_SIGN]: '>=1.1.0',
  [SAFE_FEATURES.ACCOUNT_ABSTRACTION]: '>=1.3.0',
  [SAFE_FEATURES.REQUIRED_TXGAS]: '<=1.2.0',
  [SAFE_FEATURES.SIMULATE_AND_REVERT]: '>=1.3.0',
  [SAFE_FEATURES.PASSKEY_SIGNER]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_L2_CONTRACTS]: '>=1.3.0'
}

export const hasSafeFeature = (feature: SAFE_FEATURES, version: string): boolean => {
  if (!(feature in SAFE_FEATURES_BY_VERSION)) {
    return false
  }

  return semverSatisfies(version, SAFE_FEATURES_BY_VERSION[feature])
}

export type SafeContractCompatibleWithFallbackHandler =
  | SafeContract_v1_1_1
  | SafeContract_v1_2_0
  | SafeContract_v1_3_0
  | SafeContract_v1_4_1

export type SafeContractCompatibleWithGuardManager = SafeContract_v1_3_0 | SafeContract_v1_4_1

export type SafeContractCompatibleWithModuleManager = SafeContract_v1_3_0 | SafeContract_v1_4_1

export type SafeContractCompatibleWithRequiredTxGas =
  | SafeContract_v1_0_0
  | SafeContract_v1_1_1
  | SafeContract_v1_2_0

export type SafeContractCompatibleWithSimulateAndRevert = SafeContract_v1_3_0 | SafeContract_v1_4_1

export async function isSafeContractCompatibleWithRequiredTxGas(
  safeContract: SafeContractImplementationType
): Promise<SafeContractCompatibleWithRequiredTxGas> {
  const safeVersion = safeContract.safeVersion

  if (!hasSafeFeature(SAFE_FEATURES.REQUIRED_TXGAS, safeVersion)) {
    throw new Error('Current version of the Safe does not support the requiredTxGas functionality')
  }

  return safeContract as SafeContractCompatibleWithRequiredTxGas
}

export async function isSafeContractCompatibleWithSimulateAndRevert(
  safeContract: SafeContractImplementationType
): Promise<SafeContractCompatibleWithSimulateAndRevert> {
  const safeVersion = safeContract.safeVersion

  if (!hasSafeFeature(SAFE_FEATURES.SIMULATE_AND_REVERT, safeVersion)) {
    throw new Error(
      'Current version of the Safe does not support the simulateAndRevert functionality'
    )
  }

  return safeContract as SafeContractCompatibleWithSimulateAndRevert
}
