import { expect } from 'chai'
import { getApiKit } from '../utils/setupKits'

describe('getServiceInfo', () => {
  it('should return the Safe service info', async () => {
    const safeApiKit = getApiKit()
    const serviceInfo = await safeApiKit.getServiceInfo()
    expect(serviceInfo).to.have.property('version').to.be.a('string').not.empty
    expect(serviceInfo).to.have.property('buildCommit')
  })
})
