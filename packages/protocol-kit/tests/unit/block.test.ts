import chai from 'chai'
import { asBlockId } from '../../src/utils/block'

describe('block utils', () => {
  describe('asBlockId', () => {
    it('returns a blockNumber for numeric block ids', () => {
      chai.expect(asBlockId(123)).to.deep.equal({ blockNumber: 123 })
    })

    it('returns a blockTag for string block ids', () => {
      chai.expect(asBlockId('latest')).to.deep.equal({ blockTag: 'latest' })
    })
  })
})
