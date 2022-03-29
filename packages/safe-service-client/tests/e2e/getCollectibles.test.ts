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
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getCollectibles(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the list of collectibles', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const safeCollectibleResponse = await serviceSdk.getCollectibles(safeAddress)
    chai.expect(safeCollectibleResponse.length).to.be.equal(2)
    safeCollectibleResponse.map((safeCollectible) => {
      chai.expect(safeCollectible.address).to.be.equal('0x9cf1A34D70261f0594823EFCCeed53C8c639c464')
      chai.expect(safeCollectible.tokenName).to.be.equal('Safe NFTs')
      chai.expect(safeCollectible.metadata.type).to.be.equal('ERC721')
    })
  })

  it('should return the list of collectibles EIP-3770', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeCollectibleResponse = await serviceSdk.getCollectibles(eip3770SafeAddress)
    chai.expect(safeCollectibleResponse.length).to.be.equal(2)
    safeCollectibleResponse.map((safeCollectible) => {
      chai.expect(safeCollectible.address).to.be.equal('0x9cf1A34D70261f0594823EFCCeed53C8c639c464')
      chai.expect(safeCollectible.tokenName).to.be.equal('Safe NFTs')
      chai.expect(safeCollectible.metadata.type).to.be.equal('ERC721')
    })
  })
})
