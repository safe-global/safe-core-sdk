import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { getSafe, SafeInfo } from 'tests/helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getNextNonce', () => {
  let API_TESTING_SAFE: SafeInfo
  before(async () => {
    API_TESTING_SAFE = getSafe()
    safeApiKit = getApiKit()
  })

  // The next nonce is the one after the highest pending nonce
  const getExpectedNextNonce = async (safeAddress: string) => {
    const { results } = await safeApiKit.getPendingTransactions(safeAddress, {
      nonceOrder: 'desc',
      limit: 1
    })
    return (BigInt(results[0].nonce) + 1n).toString()
  }

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getNextNonce(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return the next Safe nonce when there are pending transactions', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(await getExpectedNextNonce(safeAddress))
    chai.expect(Number(nextNonce)).to.be.greaterThan(Number(API_TESTING_SAFE.nonce))
  })

  it('should return the next Safe nonce when there are pending transactions EIP-3770', async () => {
    const safeAddress = API_TESTING_SAFE.address
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const nextNonce = await safeApiKit.getNextNonce(eip3770SafeAddress)
    chai.expect(nextNonce).to.be.equal(await getExpectedNextNonce(safeAddress))
  })

  it('should return the current Safe nonce when there are no pending transactions', async () => {
    const safeAddress = '0x513697456eDb113aDCAA1bbDA5bE59D9D7A2efd1' // Safe without pending transactions
    const { nonce } = await safeApiKit.getSafeInfo(safeAddress)
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(nonce)
  })
})
