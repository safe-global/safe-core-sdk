import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Off-chain signatures', () => {
  const [user1, user2, user3] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address])
    }
  })

  describe('signTransactionHash', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user1.provider)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      await chai
        .expect(safeSdk.signTransactionHash(txHash))
        .to.be.rejectedWith('No signer provided')
    })

    it('should fail if signer is not an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user3)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      await chai
        .expect(safeSdk.signTransactionHash(txHash))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })

    it('should sign a transaction hash with the current signer', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user1)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk.getTransactionHash(tx)
      const signature = await safeSdk.signTransactionHash(txHash)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })
  })

  describe('signTransaction', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user1.provider)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk.signTransaction(tx)).to.be.rejectedWith('No signer provided')
    })

    it('should fail if signature is added by an account that is not an owner', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user3)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai
        .expect(safeSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })

    it('should add the signature of the current signer', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user1)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      chai.expect(tx.signatures.size).to.be.eq(0)
      await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
    })

    it('should ignore duplicated signatures', async () => {
      const { safe } = await setupTests()
      const safeSdk = await EthersSafe.create(ethers, safe.address, user1)
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      chai.expect(tx.signatures.size).to.be.eq(0)
      await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
      await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(1)
    })
  })
})
