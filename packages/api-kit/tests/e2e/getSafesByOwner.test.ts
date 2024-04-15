import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getSafesByOwner', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should fail if owner address is empty', async () => {
    const ownerAddress = ''
    await chai
      .expect(safeApiKit.getSafesByOwner(ownerAddress))
      .to.be.rejectedWith('Invalid owner address')
  })

  it('should fail if owner address is not checksummed', async () => {
    const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'.toLowerCase()
    await chai
      .expect(safeApiKit.getSafesByOwner(ownerAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty array if there are no owned Safes', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000001'
    const ownerResponse = await safeApiKit.getSafesByOwner(ownerAddress)
    const { safes } = ownerResponse
    chai.expect(safes.length).to.be.equal(0)
  })

  it('should return the array of owned Safes', async () => {
    const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const ownerResponse = await safeApiKit.getSafesByOwner(ownerAddress)
    const { safes } = ownerResponse
    chai.expect(safes.length).to.be.greaterThan(1)
  })

  it('should return the array of owned Safes EIP-3770', async () => {
    const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const eip3770OwnerAddress = `${config.EIP_3770_PREFIX}:${ownerAddress}`
    const ownerResponse = await safeApiKit.getSafesByOwner(eip3770OwnerAddress)
    const { safes } = ownerResponse
    chai.expect(safes.length).to.be.greaterThan(1)
  })
})
