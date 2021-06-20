import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { getAccounts } from './utils/setupConfig'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('On-chain signatures', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('approveTransactionHash', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer.provider,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(txHash))
        .to.be.rejectedWith('No signer provided')
    })

    it('should fail if a transaction hash is approved by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account3.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const hash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Transaction hashes can only be approved by Safe owners')
    })

    it('should approve the transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const txResponse = await safeSdk1.approveTransactionHash(txHash)
      await txResponse.wait()
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(0)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await txResponse1.wait()
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1)
      const txResponse2 = await safeSdk1.approveTransactionHash(txHash)
      await txResponse2.wait()
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: account1.signer,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({
        providerOrSigner: account2.signer,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const ownersWhoApproved0 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved0.length).to.be.eq(0)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await txResponse1.wait()
      const ownersWhoApproved1 = await safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved1.length).to.be.eq(1)
      const txResponse2 = await safeSdk2.approveTransactionHash(txHash)
      await txResponse2.wait()
      const ownersWhoApproved2 = await safeSdk2.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved2.length).to.be.eq(2)
    })
  })
})
