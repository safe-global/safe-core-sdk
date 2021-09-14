import chai from 'chai'
import SafeServiceClient, { TokenInfoListResponse } from '../src'
import config from './config'

describe('getTokenList', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse: TokenInfoListResponse = await serviceSdk.getTokenList()
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
