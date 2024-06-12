import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from '../constants'

const EQ_0_2_0 = '0.2.0'

export const EQ_OR_GT_0_3_0 = '>=0.3.0'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export function entryPointToSafeModules(entryPoint: string): string {
  const moduleVersionToEntryPoint: Record<string, string> = {
    [ENTRYPOINT_ADDRESS_V06]: EQ_0_2_0,
    [ENTRYPOINT_ADDRESS_V07]: EQ_OR_GT_0_3_0
  }

  return moduleVersionToEntryPoint[entryPoint]
}

export function isEntryPointV6(address: string): boolean {
  return sameString(address, ENTRYPOINT_ADDRESS_V06)
}
