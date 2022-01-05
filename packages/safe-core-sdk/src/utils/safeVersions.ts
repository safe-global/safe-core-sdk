import semverSatisfies from 'semver/functions/satisfies'

export enum FEATURES {
  SAFE_TX_GAS_OPTIONAL
}

const FEATURES_BY_VERSION: Record<string, string> = {
  [FEATURES.SAFE_TX_GAS_OPTIONAL]: '>=1.3.0'
}

const isEnabledByVersion = (feature: FEATURES, version: string): boolean => {
  if (!(feature in FEATURES_BY_VERSION)) {
    return true
  }
  return semverSatisfies(version, FEATURES_BY_VERSION[feature])
}

export const enabledFeatures = (version: string): FEATURES[] => {
  const features = Object.values(FEATURES) as FEATURES[]
  return features.filter((feature) => isEnabledByVersion(feature, version))
}

export const hasFeature = (name: FEATURES, version: string): boolean => {
  return enabledFeatures(version).includes(name)
}
