import { expect } from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { networks, getTransactionServiceUrl } from '@safe-global/api-kit/utils/config'

import { getApiKit } from '../utils/setupKits'

let safeApiKit: SafeApiKit

describe.only('getServiceInfo', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should return the Safe service info', async () => {
    const serviceInfo = await safeApiKit.getServiceInfo()
    expect(serviceInfo.api_version).to.be.equal('v1')
  })

  describe('Network tests', () => {
    beforeEach(function (done) {
      setTimeout(done, 250) // 250 ms delay to avoid rate limiting issues
    })

    networks.forEach((network) => {
      it(`should return correct network info for ${network.shortName} (chain ID: ${network.chainId})`, async function () {
        this.timeout(10000)
        const url = getTransactionServiceUrl(network.chainId)
        console.log(`Testing URL: ${url}`)

        const serviceInfo = await safeApiKit.getServiceInfo()
        console.log(`Service Info: ${JSON.stringify(serviceInfo, null, 2)}`)
        // Verify that the response contains information about the correct network
        expect(serviceInfo).to.have.property('version')
        expect(serviceInfo).to.have.property('name')
      })
    })
  })
})
