import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getNextNonce', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getNextNonce(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return the next Safe nonce when there are pending transactions', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal((BigInt(API_TESTING_SAFE.nonce) + 2n).toString())
  })

  it('should return the next Safe nonce when there are pending transactions EIP-3770', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const nextNonce = await safeApiKit.getNextNonce(eip3770SafeAddress)
    chai.expect(nextNonce).to.be.equal((BigInt(API_TESTING_SAFE.nonce) + 2n).toString())
  })

  it('should return the next Safe nonce when there are no pending transactions', async () => {
    const safeAddress = '0xDa8dd250065F19f7A29564396D7F13230b9fC5A3'
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal('5')
  })
})
