import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { GnosisSafe } from '../typechain'
import { getMultiSend, getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  contractNetworks: ContractNetworksConfig
}

describe('On-chain signatures', () => {
  const [user1, user2, user3] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address, user2.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, contractNetworks }
    }
  )

  describe('approveTransactionHash', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1.provider,
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
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user3,
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
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
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
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(1)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = await safeSdk1.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      const txHash = await safeSdk1.getTransactionHash(tx)
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(0)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await txResponse1.wait()
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(1)
      const txResponse2 = await safeSdk1.approveTransactionHash(txHash)
      await txResponse2.wait()
      chai.expect(await safe.approvedHashes(user1.address, txHash)).to.be.equal(1)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk1 = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const safeSdk2 = await safeSdk1.connect({ providerOrSigner: user2, contractNetworks })
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
