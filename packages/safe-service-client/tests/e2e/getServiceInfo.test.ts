import { expect } from 'chai'
import SafeServiceClient from '../../src'
import { getServiceClient } from '../utils/setupServiceClient'

let serviceSdk: SafeServiceClient

describe('getServiceInfo', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should return the Safe info', async () => {
    const safeInfo = await serviceSdk.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
