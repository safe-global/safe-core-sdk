import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import semverSatisfies from 'semver/functions/satisfies'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getServiceSingletonsInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should call getServiceSingletonsInfo', async () => {
    const singletonsResponse = await safeApiKit.getServiceSingletonsInfo()
    chai.expect(singletonsResponse.length).to.be.greaterThan(1)
    singletonsResponse.map((singleton) => {
      if (semverSatisfies(singleton.version, '<1.3.0')) {
        chai.expect(singleton.deployer).to.be.equal('Gnosis')
      }
      if (semverSatisfies(singleton.version, '>=1.3.0')) {
        chai.expect(singleton.deployer).to.be.equal('Safe')
      }
    })
  })
})
