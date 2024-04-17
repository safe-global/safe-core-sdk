import { expect } from 'chai'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

let safeApiKit: SafeApiKit

describe('getServiceInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should return the Safe info', async () => {
    const safeInfo = await safeApiKit.getServiceInfo()
    expect(safeInfo.api_version).to.be.equal('v1')
  })
})
