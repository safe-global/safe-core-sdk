import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'

let safeApiKit: SafeApiKit

describe('getTokenList', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse = await safeApiKit.indexer.getTokenList({
      chainId: config.CHAIN_ID
    })
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
