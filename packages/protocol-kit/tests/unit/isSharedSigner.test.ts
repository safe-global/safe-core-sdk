import chai from 'chai'
import isSharedSigner from '@safe-global/protocol-kit/utils/passkeys/isSharedSigner'
import { PasskeyArgType } from '@safe-global/protocol-kit/types'

const { expect } = chai

// Fixture passkey with known coordinates
const PASSKEY_X = '0x1234000000000000000000000000000000000000000000000000000000000001'
const PASSKEY_Y = '0x5678000000000000000000000000000000000000000000000000000000000002'
const FCL_VERIFIER = '0xA86e0054C51E4894D88762a017ECc5E5235f5DBA'
const DAIMO_VERIFIER = '0xc2b78104907F722DABAc4C69f826a522B2754De4'
const EIP7951_PRECOMPILE = 0x0100n
const MASK_160 = (1n << 160n) - 1n

const PACKED_VERIFIERS_FCL =
  (EIP7951_PRECOMPILE << 160n) | (BigInt(FCL_VERIFIER) & MASK_160)

const PACKED_VERIFIERS_DAIMO =
  (EIP7951_PRECOMPILE << 160n) | (BigInt(DAIMO_VERIFIER) & MASK_160)

const SHARED_SIGNER_ADDRESS = '0x94a4F6affBd8975951142c3999aEAB7ecee555c2'
const SAFE_ADDRESS = '0xabc0000000000000000000000000000000000001'
const CHAIN_ID = '11155111'

function makePasskey(customVerifierAddress?: string): PasskeyArgType {
  return {
    rawId: 'deadbeef',
    coordinates: { x: PASSKEY_X, y: PASSKEY_Y },
    ...(customVerifierAddress ? { customVerifierAddress } : {})
  }
}

function makeContract(verifiers: bigint) {
  return {
    contractAddress: SHARED_SIGNER_ADDRESS,
    getConfiguration: async () => [
      {
        x: BigInt(PASSKEY_X),
        y: BigInt(PASSKEY_Y),
        verifiers
      }
    ]
  } as any
}

describe('isSharedSigner', () => {
  const owners = [SHARED_SIGNER_ADDRESS]

  describe('simple encoding (upper 16 bits zero)', () => {
    it('returns true when verifiers matches FCL verifier address', async () => {
      const contract = makeContract(BigInt(FCL_VERIFIER))
      const result = await isSharedSigner(
        makePasskey(),
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.true
    })

    it('returns true when verifiers matches customVerifierAddress', async () => {
      const contract = makeContract(BigInt(DAIMO_VERIFIER))
      const result = await isSharedSigner(
        makePasskey(DAIMO_VERIFIER),
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.true
    })

    it('returns false when verifiers does not match', async () => {
      const contract = makeContract(BigInt(DAIMO_VERIFIER))
      const result = await isSharedSigner(
        makePasskey(), // uses FCL by default
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.false
    })
  })

  describe('packed encoding (upper 16 bits = precompile, lower 160 bits = fallback)', () => {
    it('returns true when verifiers is packed with FCL as fallback', async () => {
      const contract = makeContract(PACKED_VERIFIERS_FCL)
      const result = await isSharedSigner(
        makePasskey(), // uses FCL by default
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.true
    })

    it('returns true when verifiers is packed with Daimo as fallback and customVerifierAddress is Daimo', async () => {
      const contract = makeContract(PACKED_VERIFIERS_DAIMO)
      const result = await isSharedSigner(
        makePasskey(DAIMO_VERIFIER),
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.true
    })

    it('returns false when packed verifiers has a different fallback than expected', async () => {
      const contract = makeContract(PACKED_VERIFIERS_DAIMO)
      const result = await isSharedSigner(
        makePasskey(), // expects FCL, but stored fallback is Daimo
        contract,
        SAFE_ADDRESS,
        owners,
        CHAIN_ID
      )
      expect(result).to.be.false
    })
  })

  describe('coordinates mismatch', () => {
    it('returns false when x does not match', async () => {
      const contract = {
        contractAddress: SHARED_SIGNER_ADDRESS,
        getConfiguration: async () => [
          { x: BigInt(PASSKEY_X) + 1n, y: BigInt(PASSKEY_Y), verifiers: BigInt(FCL_VERIFIER) }
        ]
      } as any
      const result = await isSharedSigner(makePasskey(), contract, SAFE_ADDRESS, owners, CHAIN_ID)
      expect(result).to.be.false
    })

    it('returns false when y does not match', async () => {
      const contract = {
        contractAddress: SHARED_SIGNER_ADDRESS,
        getConfiguration: async () => [
          { x: BigInt(PASSKEY_X), y: BigInt(PASSKEY_Y) + 1n, verifiers: BigInt(FCL_VERIFIER) }
        ]
      } as any
      const result = await isSharedSigner(makePasskey(), contract, SAFE_ADDRESS, owners, CHAIN_ID)
      expect(result).to.be.false
    })
  })

  describe('SharedSigner not in owners', () => {
    it('returns false when SharedSigner address is not in owners list', async () => {
      const contract = makeContract(BigInt(FCL_VERIFIER))
      const result = await isSharedSigner(makePasskey(), contract, SAFE_ADDRESS, [], CHAIN_ID)
      expect(result).to.be.false
    })
  })
})
