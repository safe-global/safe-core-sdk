import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient

describe('getSafeInfo', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

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
    const safeInfoResponse = await serviceSdk.getSafeInfo(safeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
  })

  it('should return an empty array if the safeTxHash is not found EIP-3770', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeInfoResponse = await serviceSdk.getSafeInfo(eip3770SafeAddress)
    chai.expect(safeInfoResponse.address).to.be.equal(safeAddress)
  })
})
