import chai from 'chai'
import { asBlockId } from '../../src/utils/block'

describe('asBlockId', () => {
  it('returns a bigint blockNumber for numeric block ids', () => {
    chai.expect(asBlockId(123)).to.deep.equal({ blockNumber: 123n })
  })

  it('returns a blockTag for string block ids', () => {
    chai.expect(asBlockId('latest')).to.deep.equal({ blockTag: 'latest' })
    chai.expect(asBlockId('pending')).to.deep.equal({ blockTag: 'pending' })
  })

  it('returns an undefined blockTag when no block id is provided', () => {
    chai.expect(asBlockId(undefined)).to.deep.equal({ blockTag: undefined })
  })
})
