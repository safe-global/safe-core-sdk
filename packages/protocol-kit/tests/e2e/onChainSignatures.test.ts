import { setupTests } from '@safe-global/testing-kit'
import Safe from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('On-chain signatures', () => {
  const provider = getEip1193Provider()
  describe('approveTransactionHash', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const safeSdk1 = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const hash = '0xcbf14050c5fcc9b71d4a3ab874cc728db101d19d4466d56fcdbb805117a28c64'
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Safe is not deployed')
    })

    it('should fail if a transaction hash is approved by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const account3 = accounts[2]
      const safeAddress = safe.address
      const safeSdk1 = await Safe.init({
        provider,
        signer: account3.address,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const hash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Transaction hashes can only be approved by Safe owners')
    })

    it('should approve the transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const [account1] = accounts
      const safeAddress = safe.address
      const safeSdk1 = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const txResponse = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safe.read.approvedHashes([account1.address, txHash])).to.be.equal(1n)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe, accounts, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const [account1] = accounts
      const safeAddress = safe.address
      const safeSdk1 = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const txHash = await safeSdk1.getTransactionHash(tx)
      chai.expect(await safe.read.approvedHashes([account1.address, txHash])).to.be.equal(0n)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      chai.expect(await safe.read.approvedHashes([account1.address, txHash])).to.be.equal(1n)
      const txResponse2 = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse2)
      chai.expect(await safe.read.approvedHashes([account1.address, txHash])).to.be.equal(1n)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should fail if Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const safeSdk1 = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const txHash = '0xcbf14050c5fcc9b71d4a3ab874cc728db101d19d4466d56fcdbb805117a28c64'
      const ownersWhoApproved = safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved).to.be.rejectedWith('Safe is not deployed')
    })

    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests({
        safeConfig: { numberOfOwners: 2, threshold: 2 }
      })
      const [, account2] = accounts
      const safeAddress = safe.address
      const safeSdk1 = await Safe.init({
        provider,
        safeAddress: safeAddress,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        signer: account2.address
      })
      const safeTransactionData = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ transactions: [safeTransactionData] })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const ownersWhoApproved0 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved0.length).to.be.eq(0)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      const ownersWhoApproved1 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved1.length).to.be.eq(1)
      const txResponse2 = await safeSdk2.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse2)
      const ownersWhoApproved2 = await safeSdk2.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved2.length).to.be.eq(2)
    })
  })
})
