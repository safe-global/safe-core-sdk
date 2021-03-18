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
    it('should fail if signer is not provided', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai
        .expect(safeSdk.executeTransaction(tx, { gasLimit: 10000000 }))
        .rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk.signTransaction(tx)
      safeSdk.connect(safe.address, user2)
      const txHash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(txHash)
      await chai
        .expect(safeSdk.executeTransaction(tx, { gasLimit: 10000000 }))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai
        .expect(safeSdk.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute a transaction with threshold 1', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction with threshold >1', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk.signTransaction(tx)
      safeSdk.connect(safe.address, user2)
      const txHash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(txHash)
      safeSdk.connect(safe.address, user3)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk.signTransaction(tx)
      safeSdk.connect(safe.address, user2)
      const txHash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(txHash)
      safeSdk.connect(safe.address, user3)
      const txResponse = await safeSdk.executeTransaction(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash.length).to.be.eq(66)
    })
  })
})
