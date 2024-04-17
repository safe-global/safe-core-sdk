import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getTokenList', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should return an array of tokens', async () => {
    const tokenInfoListResponse = await safeApiKit.getTokenList()
    chai.expect(tokenInfoListResponse.count).to.be.greaterThan(1)
    chai.expect(tokenInfoListResponse.results.length).to.be.greaterThan(1)
  })
})
