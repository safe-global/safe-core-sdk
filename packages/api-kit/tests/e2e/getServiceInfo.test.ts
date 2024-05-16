import { expect } from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

let safeApiKit: SafeApiKit

describe('getServiceInfo', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should return the Safe info', async () => {
    const safeInfo = await safeApiKit.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
