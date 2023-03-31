import { expect } from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getServiceInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should return the Safe info', async () => {
    const safeInfo = await safeApiKit.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
