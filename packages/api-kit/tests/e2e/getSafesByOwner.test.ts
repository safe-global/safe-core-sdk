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
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
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
