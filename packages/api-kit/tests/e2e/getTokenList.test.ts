import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

let safeApiKit: SafeApiKit

describe('getTokenList', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse = await safeApiKit.getTokenList()
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
