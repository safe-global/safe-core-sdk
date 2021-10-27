import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import config from './config'
chai.use(chaiAsPromised)

describe('getNextNonce', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getNextNonce(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return the next Safe nonce when there are pending transactions', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const nextNonce = await serviceSdk.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(10)
  })

  it('should return the next Safe nonce when there are no pending transactions', async () => {
    const safeAddress = '0x3e1ee196231490c8483df2D57403c7B814f91803'
    const nextNonce = await serviceSdk.getNextNonce(safeAddress)
    chai.expect(nextNonce).to.be.equal(0)
  })
})  
