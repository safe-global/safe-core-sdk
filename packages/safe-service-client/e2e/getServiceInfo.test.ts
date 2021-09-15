import { expect } from 'chai'
import SafeServiceClient, { SafeServiceInfoResponse } from '../src'
import config from './config'

describe('getServiceInfo', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should return the Safe info', async () => {
    const safeInfo: SafeServiceInfoResponse = await serviceSdk.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
