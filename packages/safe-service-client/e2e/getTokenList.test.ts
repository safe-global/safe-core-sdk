import chai from 'chai'
import SafeServiceClient from '../src'
import config from './config'

describe('getTokenList', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse = await serviceSdk.getTokenList()
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
