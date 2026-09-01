import {
  entryPointToSafeModules,
  isEntryPointV6,
  isEntryPointV7,
  sameString,
  EQ_OR_GT_0_3_0
} from './entrypoint'
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from '../constants'

describe('entryPointToSafeModules', () => {
  it('resolves the required Safe modules version for a checksummed entrypoint address', () => {
    expect(entryPointToSafeModules(ENTRYPOINT_ADDRESS_V06)).toBe('0.2.0')
    expect(entryPointToSafeModules(ENTRYPOINT_ADDRESS_V07)).toBe(EQ_OR_GT_0_3_0)
  })

  it('resolves the required Safe modules version for a lower-cased entrypoint address', () => {
    expect(entryPointToSafeModules(ENTRYPOINT_ADDRESS_V07.toLowerCase())).toBe(EQ_OR_GT_0_3_0)
    expect(entryPointToSafeModules(ENTRYPOINT_ADDRESS_V06.toLowerCase())).toBe('0.2.0')
  })

  it('returns undefined for an entrypoint address that does not match any known entrypoint', () => {
    expect(entryPointToSafeModules('0x0000000000000000000000000000000000000000')).toBeUndefined()
  })
})

describe('sameString', () => {
  it('compares strings case-insensitively', () => {
    expect(sameString('0xAbC', '0xabc')).toBe(true)
    expect(sameString('0xAbC', '0xdef')).toBe(false)
  })
})

describe('isEntryPointV6 / isEntryPointV7', () => {
  it('recognizes checksummed and lower-cased entrypoint addresses alike', () => {
    expect(isEntryPointV6(ENTRYPOINT_ADDRESS_V06)).toBe(true)
    expect(isEntryPointV6(ENTRYPOINT_ADDRESS_V06.toLowerCase())).toBe(true)
    expect(isEntryPointV7(ENTRYPOINT_ADDRESS_V07)).toBe(true)
    expect(isEntryPointV7(ENTRYPOINT_ADDRESS_V07.toLowerCase())).toBe(true)
  })
})
