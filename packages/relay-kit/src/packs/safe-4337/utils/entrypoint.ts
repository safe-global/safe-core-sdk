import Safe from '@safe-global/protocol-kit'
import {
  ENTRYPOINT_ABI,
  ENTRYPOINT_ADDRESS_V06,
  ENTRYPOINT_ADDRESS_V07
} from '@safe-global/relay-kit/packs/safe-4337/constants'

const EQ_0_2_0 = '0.2.0'

export const EQ_OR_GT_0_3_0 = '>=0.3.0'

export function sameString(str1: string, str2: string): boolean {
  return str1.toLowerCase() === str2.toLowerCase()
}

export function entryPointToSafeModules(entryPoint: string) {
  const moduleVersionToEntryPoint: Record<string, typeof EQ_0_2_0 | typeof EQ_OR_GT_0_3_0> = {
    [ENTRYPOINT_ADDRESS_V06]: EQ_0_2_0,
    [ENTRYPOINT_ADDRESS_V07]: EQ_OR_GT_0_3_0
  }

  return moduleVersionToEntryPoint[entryPoint]
}

export function isEntryPointV6(address: string): boolean {
  return sameString(address, ENTRYPOINT_ADDRESS_V06)
}

export function isEntryPointV7(address: string): boolean {
  return sameString(address, ENTRYPOINT_ADDRESS_V07)
}

export async function getSafeNonceFromEntrypoint(
  protocolKit: Safe,
  safeAddress: string,
  entryPointAddress: string
): Promise<bigint> {
  const safeProvider = protocolKit.getSafeProvider()

  const newNonce = await safeProvider.readContract({
    address: entryPointAddress || '0x',
    abi: ENTRYPOINT_ABI,
    functionName: 'getNonce',
    args: [safeAddress, 0n]
  })

  return newNonce
}
