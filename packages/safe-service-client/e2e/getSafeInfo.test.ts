import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeInfoResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getSafeInfo', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getSafeInfo(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty array if the safeTxHash is not found', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const safeInfoResponse: SafeInfoResponse = await serviceSdk.getSafeInfo(safeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
  })
})
