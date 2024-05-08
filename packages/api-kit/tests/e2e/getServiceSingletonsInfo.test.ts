import chai from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import semverSatisfies from 'semver/functions/satisfies'
import { getApiKit } from '../utils/setupKits'

let safeApiKit: SafeApiKit

describe('getServiceSingletonsInfo', () => {
  before(async () => {
    safeApiKit = getApiKit()
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
