import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { SafeTransaction } from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('On-chain signatures', () => {
  const [user1, user2, user3] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address])
    }
  })

  describe('approveTransactionHash', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(txHash))
        .to.be.rejectedWith('No signer provided')
    })

    it('should fail if a transaction hash is approved by an account that is not an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user3)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Transaction hashes can only be approved by Safe owners')
    })

    it('should return the pre-validated signature without approving the transaction hash on-chain if specified', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const signature = await safeSdk1.approveTransactionHash(txHash, true)
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(0)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })

    it('should return the pre-validated signature and approve the transaction hash', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk1.getTransactionHash(tx)
      const signature = await safeSdk1.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk1.getTransactionHash(tx)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(0)
      await safeSdk1.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
      await safeSdk1.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe } = await setupTests()
      const safeSdk1 = await EthersSafe.create(ethers, safe.address, user1)
      const safeSdk2 = await safeSdk1.connect(user2)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const ownersWhoApproved0 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved0.length).to.be.eq(0)
      await safeSdk1.approveTransactionHash(txHash)
      const ownersWhoApproved1 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved1.length).to.be.eq(1)
      await safeSdk2.approveTransactionHash(txHash)
      const ownersWhoApproved2 = await safeSdk2.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved2.length).to.be.eq(2)
    })
  })
})
