import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers } from 'hardhat'
import EthersSafe from '../src'
import { getAccounts } from './utils/setupConfig'
import { getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('Transactions execution', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts
    }
  })

  describe('execTransaction', async () => {
    it('should fail if a provider is provided', async () => {
      const { safe, accounts } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, accounts[0].signer.provider)
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if no provider or signer is provided', async () => {
      const mainnetGnosisDAOSafe = '0x0da0c3e52c977ed3cbc641ff02dd271c3ed55afe'
      const safeSdk1 = await EthersSafe.create(ethers, mainnetGnosisDAOSafe)
      const tx = await safeSdk1.createTransaction({
        to: mainnetGnosisDAOSafe,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { accounts } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, account1.signer)
      const safeSdk2 = await safeSdk1.connect(account2.signer)
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse = await safeSdk2.approveTransactionHash(txHash)
      await txResponse.wait()
      await chai
        .expect(safeSdk2.executeTransaction(tx))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const { accounts } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, account1.signer)
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute a transaction with threshold 1', async () => {
      const { accounts } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, account1.signer)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000')
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000',
        data: '0x'
      })
      const txResponse = await safeSdk1.executeTransaction(tx)
      await txResponse.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })

    it('should execute a transaction with threshold >1', async () => {
      const { accounts } = await setupTests()
      const [account1, account2, account3] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address, account3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, account1.signer)
      const safeSdk2 = await safeSdk1.connect(account2.signer)
      const safeSdk3 = await safeSdk1.connect(account3.signer)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000')
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000',
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(tx)
      await txResponse2.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe, accounts } = await setupTests()
      const [account1, account2, account3] = accounts
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, account1.signer)
      const safeSdk2 = await safeSdk1.connect(account2.signer)
      const safeSdk3 = await safeSdk1.connect(account3.signer)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000')
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      const tx = await safeSdk1.createTransaction({
        to: account2.address,
        value: '500000000000000000',
        data: '0x'
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      const txResponse1 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse1.wait()
      const txResponse2 = await safeSdk3.executeTransaction(tx)
      await txResponse2.wait()
      const safeFinalBalance = await safeSdk1.getBalance()
      chai
        .expect(safeInitialBalance.toString())
        .to.be.eq(safeFinalBalance.add(BigNumber.from(tx.data.value).toString()))
    })
  })
})
