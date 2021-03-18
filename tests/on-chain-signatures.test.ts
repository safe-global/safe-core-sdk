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
      const safeSdk = new EthersSafe(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      chai.expect(safeSdk.approveTransactionHash(txHash)).to.be.rejectedWith('No signer provided')
    })

    it('should fail if a transaction hash is approved by an account that is not an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user3)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk.getTransactionHash(tx)
      chai
        .expect(safeSdk.approveTransactionHash(hash))
        .to.be.rejectedWith('Transaction hashes can only be approved by Safe owners')
    })

    it('should return signature without approving the transaction hash on-chain if specified', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(txHash, true)
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(0)
    })

    it('should approve a transaction hash', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const hash = await safeSdk.getTransactionHash(tx)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(0)
      await safeSdk.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
      await safeSdk.approveTransactionHash(hash)
      chai.expect(await safe.approvedHashes(user1.address, hash)).to.be.equal(1)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      const ownersWhoApproved0 = await safeSdk.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved0.length).to.be.eq(0)
      await safeSdk.approveTransactionHash(txHash)
      const ownersWhoApproved1 = await safeSdk.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved1.length).to.be.eq(1)
      safeSdk.connect(safe.address, user2)
      await safeSdk.approveTransactionHash(txHash)
      const ownersWhoApproved2 = await safeSdk.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved2.length).to.be.eq(2)
    })
  })

  describe('execTransaction', async () => {
    it('should fail if signer is not provided', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1.provider)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      chai
        .expect(safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 }))
        .rejectedWith('No signer provided')
    })

    it('should fail if there are not enough signatures (1 missing)', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai
        .expect(safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 }))
        .to.be.rejectedWith('There is 1 signature missing')
    })

    it('should fail if there are not enough signatures (>1 missing)', async () => {
      const safe = await getSafeWithOwners([user1.address, user2.address, user3.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user2)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await chai
        .expect(safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 }))
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
      const txResponse = await safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash).not.to.be.null
    })

    it('should execute a transaction with threshold 2', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      await safeSdk.approveTransactionHash(txHash)
      safeSdk.connect(safe.address, user2)
      const txResponse = await safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash).not.to.be.null
    })

    it('should execute a transaction when is not submitted by an owner', async () => {
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const tx = new SafeTransaction({
        to: safe.address,
        value: '0',
        data: '0x',
        nonce: (await safe.nonce()).toString()
      })
      await safeSdk.signTransaction(tx)
      safeSdk.connect(safe.address, user2)
      const txResponse = await safeSdk.executeTransactionOnChain(tx, { gasLimit: 10000000 })
      chai.expect(txResponse.hash).not.to.be.null
    })
  })
})
