import chai from 'chai'
import SafeServiceClient from '../../src'
import { getServiceClient } from '../utils/setupServiceClient'

let serviceSdk: SafeServiceClient

describe('getTokenList', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse = await serviceSdk.getTokenList()
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
