import chai from 'chai'
import { extractSignature } from '@safe-global/protocol-kit/utils'

const { expect } = chai

/**
 * Builds a minimal DER-encoded ECDSA signature: SEQUENCE { INTEGER r, INTEGER s }
 */
function buildDerSignature(rHex: string, sHex: string): Uint8Array {
  const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'))
  const rBytes = hexToBytes(rHex)
  const sBytes = hexToBytes(sHex)
  const body = new Uint8Array([0x02, rBytes.length, ...rBytes, 0x02, sBytes.length, ...sBytes])
  return new Uint8Array([0x30, body.length, ...body])
}

describe('extractSignature', () => {
  const rHex = '11'.repeat(32)
  const sHex = '22'.repeat(32)

  it('extracts r and s from a fresh, zero-offset Uint8Array', () => {
    const sig = buildDerSignature(rHex, sHex)
    const [r, s] = extractSignature(sig)
    expect(r).to.equal(BigInt('0x' + rHex))
    expect(s).to.equal(BigInt('0x' + sHex))
  })

  it('extracts r and s from an ArrayBuffer', () => {
    const sig = buildDerSignature(rHex, sHex)
    const [r, s] = extractSignature(sig.buffer)
    expect(r).to.equal(BigInt('0x' + rHex))
    expect(s).to.equal(BigInt('0x' + sHex))
  })

  it('extracts r and s from an Array<number>', () => {
    const sig = Array.from(buildDerSignature(rHex, sHex))
    const [r, s] = extractSignature(sig)
    expect(r).to.equal(BigInt('0x' + rHex))
    expect(s).to.equal(BigInt('0x' + sHex))
  })

  it('extracts r and s correctly from a pooled/offset Uint8Array view (e.g. Buffer.from(base64, "base64"))', () => {
    const derBytes = buildDerSignature(rHex, sHex)
    const b64 = Buffer.from(derBytes).toString('base64')
    // Node's Buffer.from(base64, 'base64') commonly returns a view into a shared pooled
    // ArrayBuffer with a non-zero byteOffset - this is the real-world shape that broke
    // before this fix (a naive DataView-over-.buffer read ignores the offset entirely).
    const pooled = Buffer.from(b64, 'base64')
    expect(pooled.byteOffset).to.not.equal(0)

    const [r, s] = extractSignature(pooled)
    expect(r).to.equal(BigInt('0x' + rHex))
    expect(s).to.equal(BigInt('0x' + sHex))
  })

  it('extracts r and s correctly from a Uint8Array subarray view with a non-zero offset', () => {
    const derBytes = buildDerSignature(rHex, sHex)
    const padded = new Uint8Array(derBytes.length + 10)
    padded.set(derBytes, 10)
    const view = padded.subarray(10)
    expect(view.byteOffset).to.equal(10)

    const [r, s] = extractSignature(view)
    expect(r).to.equal(BigInt('0x' + rHex))
    expect(s).to.equal(BigInt('0x' + sHex))
  })

  it('throws on an invalid sequence header', () => {
    const sig = buildDerSignature(rHex, sHex)
    sig[0] = 0x31
    expect(() => extractSignature(sig)).to.throw('invalid signature encoding')
  })

  it('throws when r exceeds maxUint256', () => {
    // 33-byte integer (leading non-zero byte + 32 bytes) exceeds uint256 range
    const bigR = '11'.repeat(33)
    const sig = buildDerSignature(bigR, sHex)
    expect(() => extractSignature(sig)).to.throw('invalid signature encoding')
  })
})
