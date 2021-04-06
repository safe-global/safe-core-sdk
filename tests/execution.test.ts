import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
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
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if no provider or signer is provided', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai.expect(safeSdk1.executeTransaction(tx)).rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
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
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai
        .expect(safeSdk1.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute a transaction with threshold 1', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txResponse = await safeSdk1.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction with threshold >1', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      await safeSdk2.approveTransactionHash(txHash)
      const txResponse = await safeSdk3.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = new EthersSafe(ethers, safe.address, user1)
      const safeSdk2 = safeSdk1.connect(user2)
      const safeSdk3 = safeSdk1.connect(user3)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk1.signTransaction(tx)
      const txHash = await safeSdk2.getTransactionHash(tx)
      await safeSdk2.approveTransactionHash(txHash)
      const txResponse = await safeSdk3.executeTransaction(tx)
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })
  })
})
