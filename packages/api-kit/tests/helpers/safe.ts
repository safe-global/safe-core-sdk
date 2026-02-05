export type SafeInfo = {
  address: string
  nonce: string
  threshold: number
  owners: string[]
  modules: string[]
  fallbackHandler: string
  guard: string
  version: string
  singleton: string
}

export const API_TESTING_SAFE: SafeInfo = {
  address: '0xF8ef84392f7542576F6b9d1b140334144930Ac78',
  nonce: '10',
  threshold: 2,
  owners: [
    '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    '0xDa8dd250065F19f7A29564396D7F13230b9fC5A3'
  ],
  modules: [],
  fallbackHandler: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
  guard: '0x0000000000000000000000000000000000000000',
  version: '1.3.0+L2',
  singleton: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA'
}

export const API_TESTING_SAFE_1_4_1: SafeInfo = {
  address: '0x4103eEB76EBBcB652F8B15d3817EBFC07b664b0c',
  nonce: '0',
  threshold: 2,
  owners: [
    '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    '0xDa734d0A0c2328394e3DbC88cDcD4D197142C37D'
  ],
  modules: [],
  fallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
  guard: '0x0000000000000000000000000000000000000000',
  version: '1.4.1+L2',
  singleton: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'
}

export const API_TESTING_SAFE_1_5_0: SafeInfo = {
  address: '0x698e119e679ef03F14E4e518a5F9A1D2e8E32159',
  nonce: '0',
  threshold: 2,
  owners: [
    '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    '0xB8e8e97972046ac26514A9e2F2ca1299b4c4aaB6'
  ],
  modules: [],
  fallbackHandler: '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4',
  guard: '0x0000000000000000000000000000000000000000',
  version: '1.5.0+L2',
  singleton: '0xEdd160fEBBD92E350D4D398fb636302fccd67C7e'
}

const SAFE_VERSIONS: Record<string, SafeInfo> = {
  '1.4.1': API_TESTING_SAFE_1_4_1,
  '1.5.0': API_TESTING_SAFE_1_5_0
}

/**
 * Returns the Safe contract info based on the SAFE_VERSION environment variable.
 * Defaults to v1.4.1 if no version is specified.
 * @returns SafeInfo object for the specified version
 */
export function getSafe(): SafeInfo {
  const version = process.env.SAFE_VERSION || '1.4.1'
  const safe = SAFE_VERSIONS[version]

  if (!safe) {
    throw new Error(
      `Unsupported SAFE_VERSION: ${version}. Supported versions: ${Object.keys(SAFE_VERSIONS).join(', ')}`
    )
  }

  return safe
}
