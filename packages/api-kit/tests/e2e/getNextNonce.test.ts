import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'
chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getNextNonce', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getNextNonce(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return the next Safe nonce when there are pending transactions', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(9)
  })

  it('should return the next Safe nonce when there are pending transactions EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const nextNonce = await safeApiKit.getNextNonce(eip3770SafeAddress)
    chai.expect(nextNonce).to.be.equal(9)
  })

  it('should return the next Safe nonce when there are no pending transactions', async () => {
    const safeAddress = '0x72c346260a4887F0231af41178C1c818Ce34543f'
    const nextNonce = await safeApiKit.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(5)
  })
})
