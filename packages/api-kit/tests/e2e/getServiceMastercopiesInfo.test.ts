import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getServiceMasterCopiesInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should call getServiceMasterCopiesInfo', async () => {
    const masterCopiesResponse = await safeApiKit.getServiceMasterCopiesInfo()
    chai.expect(masterCopiesResponse.length).to.be.greaterThan(1)
    masterCopiesResponse.map((masterCopy) => {
      chai.expect(masterCopy.deployer).to.be.equal('Gnosis')
    })
  })
})
