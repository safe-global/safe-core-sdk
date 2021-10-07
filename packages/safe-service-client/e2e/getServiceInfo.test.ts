import { expect } from 'chai'
import SafeServiceClient from '../src'
import config from './config'

describe('getServiceInfo', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should return the Safe info', async () => {
    const safeInfo = await serviceSdk.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
