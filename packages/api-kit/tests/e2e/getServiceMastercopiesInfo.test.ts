import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getServiceSingletonsInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should call getServiceSingletonsInfo', async () => {
    const singletonResponse = await safeApiKit.getServiceSingletonsInfo()
    chai.expect(singletonResponse.length).to.be.greaterThan(1)
    singletonResponse.map((singleton) => {
      chai.expect(singleton.deployer).to.be.equal('Gnosis')
    })
  })
})
