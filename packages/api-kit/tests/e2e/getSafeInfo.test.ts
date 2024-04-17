import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getSafeInfo', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'.toLowerCase()
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the Safe info if the address is correct', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
    const safeInfoResponse = await safeApiKit.getSafeInfo(safeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('number')
    chai.expect(safeInfoResponse.threshold).to.be.a('number')
  })

  it('should return the Safe info if EIP-3770 address is correct', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeInfoResponse = await safeApiKit.getSafeInfo(eip3770SafeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('number')
    chai.expect(safeInfoResponse.threshold).to.be.a('number')
  })
})
