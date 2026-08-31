import chai from 'chai'
import EthSafeMessage from '@safe-global/protocol-kit/utils/messages/SafeMessage'
import { SafeSignature } from '@safe-global/types-kit'

// A signer address with mixed-case characters, matching how a checksummed
// address (EIP-55) actually looks in practice.
const CHECKSUMMED_SIGNER = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'

const makeSignature = (signer: string): SafeSignature => ({
  signer,
  data: '0x' + '00'.repeat(65),
  isContractSignature: false,
  staticPart: () => '0x' + '00'.repeat(65),
  dynamicPart: () => ''
})

describe('EthSafeMessage', () => {
  describe('addSignature/isSignedBy checksum handling', () => {
    it('recognizes a signer via isSignedBy regardless of address casing', () => {
      const message = new EthSafeMessage('test message')
      message.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(message.isSignedBy(CHECKSUMMED_SIGNER)).to.be.true
      chai.expect(message.isSignedBy(CHECKSUMMED_SIGNER.toLowerCase())).to.be.true
      chai.expect(message.isSignedBy(CHECKSUMMED_SIGNER.toUpperCase().replace('0X', '0x'))).to.be
        .true
    })

    it('isSignedBy returns false for an address that never signed', () => {
      const message = new EthSafeMessage('test message')
      message.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(message.isSignedBy('0x0000000000000000000000000000000000dEaD')).to.be.false
    })

    it('the raw signatures Map still uses lowercase keys internally', () => {
      const message = new EthSafeMessage('test message')
      message.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(message.signatures.has(CHECKSUMMED_SIGNER.toLowerCase())).to.be.true
    })
  })
})
