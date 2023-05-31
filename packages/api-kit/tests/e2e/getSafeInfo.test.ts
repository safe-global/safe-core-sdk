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
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the Safe info if the address is correct', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const safeInfoResponse = await safeApiKit.getSafeInfo(safeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('number')
    chai.expect(safeInfoResponse.threshold).to.be.a('number')
  })

  it('should return the Safe info if EIP-3770 address is correct', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeInfoResponse = await safeApiKit.getSafeInfo(eip3770SafeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('number')
    chai.expect(safeInfoResponse.threshold).to.be.a('number')
  })
})
