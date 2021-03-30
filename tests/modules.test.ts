import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe modules', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address]),
    }
  })

  describe('getModules', async () => {
    it('should return an empty array if there are no modules enabled', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
    })

    it.skip('should return all the enabled modules', async () => {
      // TO-DO when enableModule() is added
    })
  })

  describe('isModuleEnabled', async () => {
    it('should return false if a module is not enabled', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.isModuleEnabled(user1.address)).to.be.false
    })

    it.skip('should return true if a module is enabled', async () => {
      // TO-DO when enableModule() is added
    })
  })

  describe('enableModule', async () => {
    // TO-DO
  })

  describe('disableModule', async () => {
    // TO-DO
  })
})
