import { SafeVersion } from '@safe-global/types-kit'
import { Address } from 'viem'

export const safeVersionDeployed = process.env.SAFE_VERSION as SafeVersion

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

const API_TESTING_SAFE_1_3_0: SafeInfo = {
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

const API_TESTING_SAFE_1_4_1: SafeInfo = {
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

const API_TESTING_SAFE_1_5_0: SafeInfo = {
  address: '0xd121c0b37253455305bD22155d2eDec867e30Ead',
  nonce: '0',
  threshold: 2,
  owners: [
    '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    '0x7bb4924812b1451A754a210e88FdD27594DFBb57'
  ],
  modules: [],
  fallbackHandler: '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4',
  guard: '0x0000000000000000000000000000000000000000',
  version: '1.5.0',
  singleton: '0xFf51A5898e281Db6DfC7855790607438dF2ca44b'
}

const SAFE_VERSIONS: Record<string, SafeInfo> = {
  '1.3.0': API_TESTING_SAFE_1_3_0,
  '1.4.1': API_TESTING_SAFE_1_4_1,
  '1.5.0': API_TESTING_SAFE_1_5_0
}

const SAFE_VERSIONS_WITH_4337_MODULE: Record<string, Address> = {
  '1.4.1': '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0'
}

/**
 * Returns the Safe contract info based on the SAFE_VERSION environment variable.
 * Defaults to v1.4.1 if no version is specified.
 * @returns SafeInfo object for the specified version
 */
export function getSafe(): SafeInfo {
  const version = safeVersionDeployed || '1.4.1'
  const safe = SAFE_VERSIONS[version]

  if (!safe) {
    throw new Error(
      `Unsupported SAFE_VERSION: ${version}. Supported versions: ${Object.keys(SAFE_VERSIONS).join(', ')}`
    )
  }

  return safe
}

/**
 * Returns the Safe contract address with ERC-4337 module enabled info based on the SAFE_VERSION environment variable.
 * Defaults to v1.4.1 if no version is specified.
 * @returns Address for the specified version, or undefined if version is not supported
 */
export function getSafeWith4337Module(): Address {
  const version = process.env.SAFE_VERSION || '1.4.1'
  return SAFE_VERSIONS_WITH_4337_MODULE[version]
}

export const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676' // Address: 0x56e2C102c664De6DfD7315d12c0178b61D16F171
export const PRIVATE_KEY_2 = '0xb88ad5789871315d0dab6fc5961d6714f24f35a6393f13a6f426dfecfc00ab44' // Address: 0x9ccbde03edd71074ea9c49e413fa9cdff16d263b
