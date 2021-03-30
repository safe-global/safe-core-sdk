import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Owners', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address]),
    }
  })

  describe('getOwners', async () => {
    it('should return the list of Safe owners', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(2)
      chai.expect(owners[0]).to.be.eq(user1.address)
      chai.expect(owners[1]).to.be.eq(user2.address)
    })
  })

  describe('addOwner', async () => {
    // TO-DO
  })

  describe('removeModule', async () => {
    // TO-DO
  })

  describe('replaceModule', async () => {
    // TO-DO
  })
})
