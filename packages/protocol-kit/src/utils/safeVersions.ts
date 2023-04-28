import semverSatisfies from 'semver/functions/satisfies'

export enum SAFE_FEATURES {
  SAFE_TX_GAS_OPTIONAL = 'SAFE_TX_GAS_OPTIONAL',
  SAFE_TX_GUARDS = 'SAFE_TX_GUARDS',
  SAFE_FALLBACK_HANDLER = 'SAFE_FALLBACK_HANDLER',
  ETH_SIGN = 'ETH_SIGN',
  ACCOUNT_ABSTRACTION = 'ACCOUNT_ABSTRACTION'
}

const SAFE_FEATURES_BY_VERSION: Record<SAFE_FEATURES, string> = {
  [SAFE_FEATURES.SAFE_TX_GAS_OPTIONAL]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_TX_GUARDS]: '>=1.3.0',
  [SAFE_FEATURES.SAFE_FALLBACK_HANDLER]: '>=1.1.1',
  [SAFE_FEATURES.ETH_SIGN]: '>=1.1.0',
  [SAFE_FEATURES.ACCOUNT_ABSTRACTION]: '>=1.3.0'
}

export const hasSafeFeature = (feature: SAFE_FEATURES, version: string): boolean => {
  if (!(feature in SAFE_FEATURES_BY_VERSION)) {
    return false
  }

  return semverSatisfies(version, SAFE_FEATURES_BY_VERSION[feature])
}
