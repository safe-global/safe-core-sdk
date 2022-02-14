import chai from 'chai'
import SafeServiceClient from '../../src'
import { getServiceClient } from '../utils/setupServiceClient'

let serviceSdk: SafeServiceClient

describe('getServiceMasterCopiesInfo', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should call getServiceMasterCopiesInfo', async () => {
    const masterCopiesResponse = await serviceSdk.getServiceMasterCopiesInfo()
    chai.expect(masterCopiesResponse.length).to.be.greaterThan(1)
    masterCopiesResponse.map((masterCopy) => {
      chai.expect(masterCopy.deployer).to.be.equal('Gnosis')
    })
  })
})
