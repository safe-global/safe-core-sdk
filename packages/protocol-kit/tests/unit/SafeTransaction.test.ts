import chai from 'chai'
import EthSafeTransaction from '@safe-global/protocol-kit/utils/transactions/SafeTransaction'
import { SafeSignature, SafeTransactionData } from '@safe-global/types-kit'

const TX_DATA: SafeTransactionData = {
  to: '0x0000000000000000000000000000000000000000',
  value: '0',
  data: '0x',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: '0x0000000000000000000000000000000000000000',
  nonce: 0
}

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

describe('EthSafeTransaction', () => {
  describe('addSignature/isSignedBy checksum handling', () => {
    it('recognizes a signer via isSignedBy regardless of address casing', () => {
      const tx = new EthSafeTransaction(TX_DATA)
      tx.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(tx.isSignedBy(CHECKSUMMED_SIGNER)).to.be.true
      chai.expect(tx.isSignedBy(CHECKSUMMED_SIGNER.toLowerCase())).to.be.true
      chai.expect(tx.isSignedBy(CHECKSUMMED_SIGNER.toUpperCase().replace('0X', '0x'))).to.be.true
    })

    it('isSignedBy returns false for an address that never signed', () => {
      const tx = new EthSafeTransaction(TX_DATA)
      tx.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(tx.isSignedBy('0x0000000000000000000000000000000000dEaD')).to.be.false
    })

    it('the raw signatures Map still uses lowercase keys internally', () => {
      const tx = new EthSafeTransaction(TX_DATA)
      tx.addSignature(makeSignature(CHECKSUMMED_SIGNER))

      chai.expect(tx.signatures.has(CHECKSUMMED_SIGNER.toLowerCase())).to.be.true
    })
  })
})
