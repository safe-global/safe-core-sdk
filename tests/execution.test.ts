import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { SafeTransaction } from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Transactions execution', () => {
  const [user1, user2, user3] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address])
    }
  })

  describe('execTransaction', async () => {
    it('should fail if a provider is provided', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if no provider or signer is provided', async () => {
      const mainnetGnosisDAOSafe = '0x0da0c3e52c977ed3cbc641ff02dd271c3ed55afe'
      const safeSdk1 = await EthersSafe.create(ethers, mainnetGnosisDAOSafe)
      const tx = new SafeTransaction({
        to: mainnetGnosisDAOSafe,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const safeSdk2 = await safeSdk1.connect(user2)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      await safeSdk2.approveTransactionHash(txHash)
      await chai
        .expect(safeSdk2.executeTransaction(tx))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute a transaction with threshold 1', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      const txResponse = await safeSdk1.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction with threshold >1', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const safeSdk2 = await safeSdk1.connect(user2)
      const safeSdk3 = await safeSdk1.connect(user3)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      await safeSdk2.approveTransactionHash(txHash)
      const txResponse = await safeSdk3.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const safeSdk2 = await safeSdk1.connect(user2)
      const safeSdk3 = await safeSdk1.connect(user3)
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from('1000000000000000000')
      })
      const safeInitialBalance = await safeSdk1.getBalance()
      chai.expect(safeInitialBalance.toString()).to.be.eq('1000000000000000000')
      const tx = new SafeTransaction({
        to: user2.address,
        value: '500000000000000000',
        data: '0x',
        nonce: await safeSdk1.getNonce()
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      await safeSdk2.approveTransactionHash(txHash)
      const txResponse = await safeSdk3.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)

      const safeFinalBalance = await safeSdk1.getBalance()
      chai.expect(safeFinalBalance.toString()).to.be.eq('500000000000000000')
    })
  })
})
