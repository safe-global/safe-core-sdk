import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe, { SafeTransactionOptionalProps } from '../src'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '../src/utils/constants'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getDailyLimitModule,
  getSafeWithOwners,
  getSocialRecoveryModule
} from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe modules manager', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      dailyLimitModule: await getDailyLimitModule(),
      socialRecoveryModule: await getSocialRecoveryModule(),
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks
    }
  })

  describe('getModules', async () => {
    it('should return all the enabled modules', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
    })
  })

  describe('isModuleEnabled', async () => {
    it('should return true if a module is enabled', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
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
    it('should fail if address is invalid', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createEnableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is already enabled', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx1 = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse)
      const tx2 = safeSdk.createEnableModuleTx(dailyLimitModule.address)
      await chai.expect(tx2).to.be.rejectedWith('Module provided is already enabled')
    })

    it('should build the transaction with the optional props', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const options: SafeTransactionOptionalProps = {
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const tx = await safeSdk.createEnableModuleTx(dailyLimitModule.address, options)
      chai.expect(tx.data.baseGas).to.be.eq(111)
      chai.expect(tx.data.gasPrice).to.be.eq(222)
      chai.expect(tx.data.gasToken).to.be.eq('0x333')
      chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx.data.nonce).to.be.eq(555)
      chai.expect(tx.data.safeTxGas).to.be.eq(666)
    })

    it('should enable a Safe module', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
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
    it('should fail if address is invalid', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is not enabled', async () => {
      const { safe, accounts, dailyLimitModule, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createDisableModuleTx(dailyLimitModule.address)
      await chai.expect(tx).to.be.rejectedWith('Module provided is not enabled yet')
    })

    it('should build the transaction with the optional props', async () => {
      const { dailyLimitModule, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })

      const tx1 = await safeSdk.createEnableModuleTx(dailyLimitModule.address)
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true

      const options: SafeTransactionOptionalProps = {
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const tx2 = await safeSdk.createDisableModuleTx(dailyLimitModule.address, options)
      chai.expect(tx2.data.baseGas).to.be.eq(111)
      chai.expect(tx2.data.gasPrice).to.be.eq(222)
      chai.expect(tx2.data.gasToken).to.be.eq('0x333')
      chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx2.data.nonce).to.be.eq(555)
      chai.expect(tx2.data.safeTxGas).to.be.eq(666)
    })

    it('should disable Safe modules', async () => {
      const { dailyLimitModule, accounts, socialRecoveryModule, contractNetworks } =
        await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
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
