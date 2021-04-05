import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe from '../src'
import { SENTINEL_MODULES, zeroAddress } from '../src/utils/constants'
import { getDailyLimitModule, getSafeWithOwners, getSocialRecoveryModule } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe modules', () => {
  const [user1] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address]),
      module1: await getDailyLimitModule(),
      module2: await getSocialRecoveryModule()
    }
  })

  describe('getModules', async () => {
    it('should return all the enabled modules', async () => {
      const { safe, module1 } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      const tx = await safeSdk.getEnableModuleTx(module1.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
    })
  })

  describe('isModuleEnabled', async () => {
    it('should return true if a module is enabled', async () => {
      const { safe, module1 } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.false
      const tx = await safeSdk.getEnableModuleTx(module1.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.true
    })
  })

  describe('getEnableModuleTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getEnableModuleTx('0x123'))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getEnableModuleTx(SENTINEL_MODULES))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getEnableModuleTx(zeroAddress))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is already enabled', async () => {
      const { safe, module1 } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = await safeSdk.getEnableModuleTx(module1.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      await chai
        .expect(safeSdk.getEnableModuleTx(module1.address))
        .to.be.rejectedWith('Module provided is already enabled')
    })

    it('should enable a Safe module', async () => {
      const { safe, module1 } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.false
      const tx = await safeSdk.getEnableModuleTx(module1.address)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      await txResponse.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.true
    })
  })

  describe('getDisableModuleTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getDisableModuleTx('0x123'))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getDisableModuleTx(SENTINEL_MODULES))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk1.getDisableModuleTx(zeroAddress))
        .to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is not enabled', async () => {
      const { safe, module1 } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      await chai
        .expect(safeSdk.getDisableModuleTx(module1.address))
        .to.be.rejectedWith('Module provided is not enabled already')
    })

    it('should disable Safe modules', async () => {
      const { module1, module2 } = await setupTests()
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)

      const tx1 = await safeSdk.getEnableModuleTx(module1.address)
      const txResponse1 = await safeSdk.executeTransaction(tx1, { gasLimit: 10000000 })
      await txResponse1.wait()
      const tx2 = await safeSdk.getEnableModuleTx(module2.address)
      const txResponse2 = await safeSdk.executeTransaction(tx2, { gasLimit: 10000000 })
      await txResponse2.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(2)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.true
      chai.expect(await safeSdk.isModuleEnabled(module2.address)).to.be.true

      const tx3 = await safeSdk.getDisableModuleTx(module1.address)
      const txResponse3 = await safeSdk.executeTransaction(tx3, { gasLimit: 10000000 })
      await txResponse3.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(module2.address)).to.be.true

      const tx4 = await safeSdk.getDisableModuleTx(module2.address)
      const txResponse4 = await safeSdk.executeTransaction(tx4, { gasLimit: 10000000 })
      await txResponse4.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(module1.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(module2.address)).to.be.false
    })
  })
})
