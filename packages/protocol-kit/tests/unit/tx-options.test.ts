import chai from 'chai'
import {
  convertTransactionOptions,
  createLegacyTxOptions,
  createTxOptions
} from '@safe-global/protocol-kit/utils'

describe('Transaction options conversion', () => {
  describe('createTxOptions (EIP-1559)', () => {
    it('should keep an explicit nonce of 0', () => {
      const converted = createTxOptions({ nonce: 0 })
      chai.expect(converted.nonce).to.be.equal(0)
    })

    it('should keep a non-zero nonce', () => {
      const converted = createTxOptions({ nonce: 7 })
      chai.expect(converted.nonce).to.be.equal(7)
    })

    it('should omit the nonce when it is not provided', () => {
      const converted = createTxOptions({})
      chai.expect(converted).to.not.have.property('nonce')
    })

    it('should omit the nonce when no options are provided', () => {
      const converted = createTxOptions(undefined)
      chai.expect(converted).to.not.have.property('nonce')
    })
  })

  describe('createLegacyTxOptions', () => {
    it('should keep an explicit nonce of 0', () => {
      const converted = createLegacyTxOptions({ nonce: 0, gasPrice: '1000000000' })
      chai.expect(converted.nonce).to.be.equal(0)
    })

    it('should keep a non-zero nonce', () => {
      const converted = createLegacyTxOptions({ nonce: 3, gasPrice: '1000000000' })
      chai.expect(converted.nonce).to.be.equal(3)
    })

    it('should omit the nonce when it is not provided', () => {
      const converted = createLegacyTxOptions({ gasPrice: '1000000000' })
      chai.expect(converted).to.not.have.property('nonce')
    })
  })

  describe('convertTransactionOptions', () => {
    it('should keep an explicit nonce of 0 for EIP-1559 transactions', () => {
      const converted = convertTransactionOptions({ nonce: 0, maxFeePerGas: '2000000000' })
      chai.expect(converted.nonce).to.be.equal(0)
    })

    it('should keep an explicit nonce of 0 for legacy transactions', () => {
      const converted = convertTransactionOptions({ nonce: 0, gasPrice: '1000000000' })
      chai.expect(converted.nonce).to.be.equal(0)
    })
  })
})
