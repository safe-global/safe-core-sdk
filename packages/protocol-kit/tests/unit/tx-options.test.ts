import chai from 'chai'
import {
  convertTransactionOptions,
  createLegacyTxOptions,
  createTxOptions
} from '../../src/utils/transactions/utils'

describe('createTxOptions', () => {
  it('keeps nonce 0', () => {
    chai.expect(createTxOptions({ nonce: 0 }).nonce).to.equal(0)
  })

  it('keeps a non-zero nonce', () => {
    chai.expect(createTxOptions({ nonce: 123 }).nonce).to.equal(123)
  })

  it('omits nonce when it is not provided', () => {
    chai.expect(createTxOptions({}).nonce).to.equal(undefined)
    chai.expect(createTxOptions().nonce).to.equal(undefined)
  })
})

describe('createLegacyTxOptions', () => {
  it('keeps nonce 0', () => {
    chai.expect(createLegacyTxOptions({ nonce: 0, gasPrice: 1 }).nonce).to.equal(0)
  })

  it('keeps a non-zero nonce', () => {
    chai.expect(createLegacyTxOptions({ nonce: 123, gasPrice: 1 }).nonce).to.equal(123)
  })

  it('omits nonce when it is not provided', () => {
    chai.expect(createLegacyTxOptions({ gasPrice: 1 }).nonce).to.equal(undefined)
  })
})

describe('convertTransactionOptions', () => {
  it('keeps nonce 0 on the EIP-1559 path', () => {
    chai.expect(convertTransactionOptions({ nonce: 0 }).nonce).to.equal(0)
  })

  it('keeps nonce 0 on the legacy path', () => {
    chai.expect(convertTransactionOptions({ nonce: 0, gasPrice: 1 }).nonce).to.equal(0)
  })
})
