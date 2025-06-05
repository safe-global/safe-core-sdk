import { expect } from 'chai'
import { getTransactionServiceUrl, networks } from '@safe-global/api-kit/utils/config'
import { getApiKit } from '../utils/setupKits'

describe('getServiceInfo', () => {
  it('should return the Safe service info', async () => {
    const safeApiKit = getApiKit()
    const serviceInfo = await safeApiKit.getServiceInfo()
    expect(serviceInfo.api_version).to.be.equal('v1')
  })

  describe('Network tests', () => {
    beforeEach(function (done) {
      setTimeout(done, 250) // 250 ms delay to avoid rate limiting issues
    })

    networks.forEach((network) => {
      it(`should return correct network info for chainId ${network.chainId} (${getTransactionServiceUrl(network.chainId)})`, async function () {
        this.timeout(10000)
        const safeApiKit = getApiKit(undefined, network.chainId)
        const serviceInfo = await safeApiKit.getServiceInfo()

        expect(serviceInfo).to.have.property('version').to.be.a('string').not.empty
        expect(serviceInfo).to.have.property('name').to.be.a('string').not.empty
      })
    })
  })
})
