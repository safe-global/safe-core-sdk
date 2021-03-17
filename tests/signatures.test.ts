import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { SafeTransaction } from '../src/index'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const [user1, user2, user3] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address]),
      chainId: (await waffle.provider.getNetwork()).chainId
    }
  })

  describe('confirmTransaction', async () => {
    it('should fail if signature is not added by an owner', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: user1.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const safeSdk = new EthersSafe(ethers, user3, safe.address)
      chai
        .expect(safeSdk.confirmTransaction(tx))
        .to.be.rejectedWith('Transactions can only be confirmed by Safe owners')
    })

    it('should ignore duplicated signatures', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: user1.address,
        value: '0',
        data: '0x',
        nonce: await safe.nonce()
      })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const safeSdk = new EthersSafe(ethers, user1, safe.address)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
    })

    it('should add owner signature', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: user1.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const safeSdk = new EthersSafe(ethers, user1, safe.address)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
    })
  })

  describe('execTransaction', async () => {
    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const safeSdk = new EthersSafe(ethers, user1, safe.address)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
      chai
        .expect(
          safeSdk.executeTransaction(tx, {
            gasLimit: 10000000
          })
        )
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const safeSdk = new EthersSafe(ethers, user1, safe.address)
      chai
        .expect(safeSdk.executeTransaction(tx))
        .to.be.rejectedWith('There are 2 signatures missing')
    })

    it('should execute transaction when there are enough signatures', async () => {
      const { safe } = await setupTests()
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      chai.expect(tx.signatures.size).to.be.eq(0)
      let safeSdk = new EthersSafe(ethers, user1, safe.address)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
      safeSdk = new EthersSafe(ethers, user2, safe.address)
      await safeSdk.confirmTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(2)
      const txResponse = await safeSdk.executeTransaction(tx)
      chai.expect(txResponse.hash).not.to.be.null
    })
  })
})
