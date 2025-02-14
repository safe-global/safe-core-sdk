import { expect } from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

let safeApiKit: SafeApiKit

describe('getServiceInfo', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should return the Safe service info', async () => {
    const serviceInfo = await safeApiKit.getServiceInfo()
    expect(serviceInfo.api_version).to.be.equal('v1')
  })
})
