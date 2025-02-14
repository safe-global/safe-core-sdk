import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getSafeInfo', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = API_TESTING_SAFE.address.toLowerCase()
    await chai
      .expect(safeApiKit.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the Safe info if the address is correct', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const safeInfoResponse = await safeApiKit.getSafeInfo(safeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('string')
    chai.expect(safeInfoResponse.threshold).to.be.equal(API_TESTING_SAFE.threshold)
    chai.expect(safeInfoResponse).to.have.property('owners').to.be.an('array')
    chai.expect(safeInfoResponse).to.have.property('modules').to.be.an('array')
    chai.expect(safeInfoResponse.fallbackHandler).to.eq(API_TESTING_SAFE.fallbackHandler)
    chai.expect(safeInfoResponse.guard).to.eq(API_TESTING_SAFE.guard)
    chai.expect(safeInfoResponse.version).to.eq(API_TESTING_SAFE.version)
    chai.expect(safeInfoResponse).to.have.property('singleton').to.eq(API_TESTING_SAFE.singleton)
    // FIXME currently the service returns masterCopy and we replace it by singleton on SafeApiKit.
    // To avoid the breaking change they will return both propertys for a while, when this happens we can remove the hack at SafApiKit.
    // The test will fail at that moment.
    chai.expect(safeInfoResponse).not.to.have.property('masterCopy')
  })

  it('should return the Safe info if EIP-3770 address is correct', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeInfoResponse = await safeApiKit.getSafeInfo(eip3770SafeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
    chai.expect(safeInfoResponse.nonce).to.be.a('string')
    chai.expect(safeInfoResponse.threshold).to.be.equal(API_TESTING_SAFE.threshold)
    chai.expect(safeInfoResponse).to.have.property('owners').to.be.an('array')
    chai.expect(safeInfoResponse).to.have.property('modules').to.be.an('array')
    chai.expect(safeInfoResponse.fallbackHandler).to.eq(API_TESTING_SAFE.fallbackHandler)
    chai.expect(safeInfoResponse.guard).to.eq(API_TESTING_SAFE.guard)
    chai.expect(safeInfoResponse.version).to.eq(API_TESTING_SAFE.version)
    chai.expect(safeInfoResponse).to.have.property('singleton').to.eq(API_TESTING_SAFE.singleton)
    // FIXME currently the service returns masterCopy and we replace it by singleton on SafeApiKit.
    // To avoid the breaking change they will return both propertys for a while, when this happens we can remove the hack at SafApiKit.
    // The test will fail at that moment.
    chai.expect(safeInfoResponse).not.to.have.property('masterCopy')
  })
})
