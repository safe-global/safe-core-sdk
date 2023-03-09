import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../../src'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient

describe('getCollectibles', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getCollectibles(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x72c346260a4887F0231af41178C1c818Ce34543f'.toLowerCase()
    await chai
      .expect(serviceSdk.getCollectibles(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the list of collectibles', async () => {
    const safeAddress = '0x72c346260a4887F0231af41178C1c818Ce34543f'
    const safeCollectibleListResponse = await serviceSdk.getCollectibles(safeAddress)
    chai.expect(safeCollectibleListResponse.count).to.be.equal(1)
    chai.expect(safeCollectibleListResponse.results.length).to.be.equal(1)
    safeCollectibleListResponse.results.map((safeCollectible) => {
      chai.expect(safeCollectible.address).to.be.equal('0x39Ec448b891c476e166b3C3242A90830DB556661')
      chai.expect(safeCollectible.tokenName).to.be.equal("Frank's Art Sale")
    })
  })

  it('should return the list of collectibles EIP-3770', async () => {
    const safeAddress = '0x72c346260a4887F0231af41178C1c818Ce34543f'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeCollectibleListResponse = await serviceSdk.getCollectibles(eip3770SafeAddress)
    chai.expect(safeCollectibleListResponse.count).to.be.equal(1)
    chai.expect(safeCollectibleListResponse.results.length).to.be.equal(1)
    safeCollectibleListResponse.results.map((safeCollectible) => {
      chai.expect(safeCollectible.address).to.be.equal('0x39Ec448b891c476e166b3C3242A90830DB556661')
      chai.expect(safeCollectible.tokenName).to.be.equal("Frank's Art Sale")
    })
  })
})
