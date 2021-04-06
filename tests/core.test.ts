import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src/index'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address]),
      chainId: (await waffle.provider.getNetwork()).chainId
    }
  })

  describe('connect', async () => {
    it('should connect with signer', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.eq(user1)
    })

    it('should connect with provider', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1.provider)
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })

    it('should connect with default provider', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address)
      const defaultProvider = safeSdk.getProvider()
      chai.expect(ethers.providers.Provider.isProvider(defaultProvider)).to.be.true
      chai.expect((await defaultProvider.getNetwork()).chainId).to.be.eq(1)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
    })
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

  describe('getThreshold', async () => {
    it('should return the Safe threshold', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.getThreshold()).to.be.eq(2)
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of the current network', async () => {
      const { safe, chainId } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
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
})
