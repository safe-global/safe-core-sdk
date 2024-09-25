import {
  getDailyLimitModule,
  getSafeWithOwners,
  getSocialRecoveryModule,
  getStateChannelModule,
  getWhiteListModule,
  setupTests
} from '@safe-global/testing-kit'
import Safe, { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/index'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'
import semverSatisfies from 'semver/functions/satisfies'

chai.use(chaiAsPromised)

describe('Safe modules manager', () => {
  const provider = getEip1193Provider()

  describe('getModules', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai.expect(safeSdk.getModules()).to.be.rejectedWith('Safe is not deployed')
    })

    it('should return all the enabled modules', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const socialRecoveryModule = await getSocialRecoveryModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      const enableDailyLimitModuleTx = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const enableDailyLimitModuleTxResponse =
        await safeSdk.executeTransaction(enableDailyLimitModuleTx)
      const socialRecoveryModuleTx = await safeSdk.createEnableModuleTx(
        socialRecoveryModule.address
      )
      const socialRecoveryModuleTxResponse =
        await safeSdk.executeTransaction(socialRecoveryModuleTx)
      await Promise.all([
        waitSafeTxReceipt(enableDailyLimitModuleTxResponse),
        waitSafeTxReceipt(socialRecoveryModuleTxResponse)
      ])
      chai.expect((await safeSdk.getModules()).length).to.be.eq(2)
    })
  })

  describe('getModulesPaginated', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai
        .expect(safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10))
        .to.be.rejectedWith('Safe is not deployed')
    })

    it('should return the enabled modules', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      const emptyModuleList = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const moduleList = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)

      chai.expect(emptyModuleList.modules.length).to.be.eq(0)
      chai.expect(emptyModuleList.next).to.be.eq(SENTINEL_ADDRESS)
      chai.expect(moduleList.modules.length).to.be.eq(1)
      chai.expect(emptyModuleList.next).to.be.eq(SENTINEL_ADDRESS)
    })

    it('should constraint returned modules by pageSize', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const socialRecoveryModule = await getSocialRecoveryModule()
      const stateChannelModule = await getStateChannelModule()
      const whiteListModule = await getWhiteListModule()
      const safeAddress = safe.address
      const dailyLimitsAddress = dailyLimitModule.address
      const socialRecoveryAddress = socialRecoveryModule.address
      const stateChannelAddress = stateChannelModule.address
      const whiteListAddress = whiteListModule.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const currentPageNext = semverSatisfies(safeSdk.getContractVersion(), '>=1.4.1')

      chai
        .expect((await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)).modules.length)
        .to.be.eq(0)

      const dailyLimitsModuleTx = await safeSdk.createEnableModuleTx(dailyLimitsAddress)
      const dailyLimitsResponse = await safeSdk.executeTransaction(dailyLimitsModuleTx)
      await waitSafeTxReceipt(dailyLimitsResponse)

      const socialRecoveryModuleTx = await safeSdk.createEnableModuleTx(socialRecoveryAddress)
      const socialRecoveryResponse = await safeSdk.executeTransaction(socialRecoveryModuleTx)
      await waitSafeTxReceipt(socialRecoveryResponse)

      const stateChannelModuleTx = await safeSdk.createEnableModuleTx(stateChannelAddress)
      const stateChannelResponse = await safeSdk.executeTransaction(stateChannelModuleTx)
      await waitSafeTxReceipt(stateChannelResponse)

      const whiteListModuleTx = await safeSdk.createEnableModuleTx(whiteListAddress)
      const whiteListResponse = await safeSdk.executeTransaction(whiteListModuleTx)
      await waitSafeTxReceipt(whiteListResponse)

      const modules1 = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)
      const modules2 = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 1)
      const modules3 = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 2)

      chai.expect(modules1.modules.length).to.be.eq(4)
      chai
        .expect(modules1.modules)
        .to.deep.eq([
          whiteListAddress,
          stateChannelAddress,
          socialRecoveryAddress,
          dailyLimitsAddress
        ])
      chai.expect(modules1.next).to.be.eq(SENTINEL_ADDRESS)

      chai.expect(modules2.modules.length).to.be.eq(1)
      chai.expect(modules2.modules).to.deep.eq([whiteListAddress])
      chai.expect(modules2.next).to.be.eq(currentPageNext ? whiteListAddress : stateChannelAddress)

      chai.expect(modules3.modules.length).to.be.eq(2)
      chai.expect(modules3.modules).to.deep.eq([whiteListAddress, stateChannelAddress])
      chai
        .expect(modules3.next)
        .to.be.eq(currentPageNext ? stateChannelAddress : socialRecoveryAddress)
    })

    it('should offset the returned modules', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const dailyLimitModule = await getDailyLimitModule()
      const socialRecoveryModule = await getSocialRecoveryModule()
      const stateChannelModule = await getStateChannelModule()
      const whiteListModule = await getWhiteListModule()

      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const currentPageNext = semverSatisfies(safeSdk.getContractVersion(), '>=1.4.1')

      const moduleDeployment = [
        dailyLimitModule.address,
        socialRecoveryModule.address,
        stateChannelModule.address,
        whiteListModule.address
      ].map(async (moduleAddress) => {
        const txModule = await safeSdk.createEnableModuleTx(moduleAddress)
        const moduleResponse = await safeSdk.executeTransaction(txModule)
        await waitSafeTxReceipt(moduleResponse)
      })

      await Promise.all(moduleDeployment)

      const {
        modules: [firstModule, secondModule, thirdModule, fourthModule]
      } = await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)

      const modules1 = await safeSdk.getModulesPaginated(firstModule, 10)
      const modules2 = await safeSdk.getModulesPaginated(firstModule, 2)
      const modules3 = await safeSdk.getModulesPaginated(firstModule, 3)

      chai
        .expect((await safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 10)).modules.length)
        .to.be.eq(4)
      chai.expect(modules1.modules).to.deep.eq([secondModule, thirdModule, fourthModule])
      chai.expect(modules1.next).to.be.eq(SENTINEL_ADDRESS)
      chai.expect(modules2.modules).to.deep.eq([secondModule, thirdModule])
      chai.expect(modules2.next).to.be.eq(currentPageNext ? thirdModule : fourthModule)
      chai.expect(modules3.modules).to.deep.eq([secondModule, thirdModule, fourthModule])
      chai.expect(modules3.next).to.be.eq(SENTINEL_ADDRESS)
    })

    it('should fail if pageSize is invalid', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })

      chai
        .expect(safeSdk.getModulesPaginated(SENTINEL_ADDRESS, 0))
        .to.be.rejectedWith('Invalid page size for fetching paginated modules')
    })
  })

  describe('isModuleEnabled', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.isModuleEnabled(dailyLimitModule.address)
      chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    it('should return true if a module is enabled', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
    })
  })

  describe('createEnableModuleTx', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx(dailyLimitModule.address)
      chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    it('should fail if address is invalid', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is already enabled', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx1 = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse)
      const tx2 = safeSdk.createEnableModuleTx(dailyLimitModule.address)
      await chai.expect(tx2).to.be.rejectedWith('Module provided is already enabled')
    })

    it('should build the transaction with the optional props', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const options: SafeTransactionOptionalProps = {
        baseGas: '111',
        gasPrice: '222',
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: '666'
      }
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address, options)
      chai.expect(tx.data.baseGas).to.be.eq('111')
      chai.expect(tx.data.gasPrice).to.be.eq('222')
      chai.expect(tx.data.gasToken).to.be.eq('0x333')
      chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx.data.nonce).to.be.eq(555)
      chai.expect(tx.data.safeTxGas).to.be.eq('666')
    })

    it('should enable a Safe module', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
    })
  })

  describe('createDisableModuleTx', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(dailyLimitModule.address)
      chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    it('should fail if address is invalid', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is not enabled', async () => {
      const { safe, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(dailyLimitModule.address)
      await chai.expect(tx).to.be.rejectedWith('Module provided is not enabled yet')
    })

    it('should build the transaction with the optional props', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      const tx1 = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true

      const options: SafeTransactionOptionalProps = {
        baseGas: '111',
        gasPrice: '222',
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: '666'
      }
      const tx2 = await safeSdk.createDisableModuleTx(dailyLimitModule.address, options)
      chai.expect(tx2.data.baseGas).to.be.eq('111')
      chai.expect(tx2.data.gasPrice).to.be.eq('222')
      chai.expect(tx2.data.gasToken).to.be.eq('0x333')
      chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx2.data.nonce).to.be.eq(555)
      chai.expect(tx2.data.safeTxGas).to.be.eq('666')
    })

    it('should disable Safe modules', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const dailyLimitModule = await getDailyLimitModule()
      const socialRecoveryModule = await getSocialRecoveryModule()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      const tx1 = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      const tx2 = await safeSdk.createEnableModuleTx(socialRecoveryModule.address)
      const txResponse2 = await safeSdk.executeTransaction(tx2)
      await waitSafeTxReceipt(txResponse2)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(2)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.true

      const tx3 = await safeSdk.createDisableModuleTx(dailyLimitModule.address)
      const txResponse3 = await safeSdk.executeTransaction(tx3)
      await waitSafeTxReceipt(txResponse3)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.true

      const tx4 = await safeSdk.createDisableModuleTx(socialRecoveryModule.address)
      const txResponse4 = await safeSdk.executeTransaction(tx4)
      await waitSafeTxReceipt(txResponse4)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.false
    })
  })
})
