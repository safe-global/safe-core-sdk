import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('On-chain signatures', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [accounts[0].address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }
    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks,
      predictedSafe
    }
  })

  describe('approveTransactionHash', async () => {
    it('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })
      const hash = '0xcbf14050c5fcc9b71d4a3ab874cc728db101d19d4466d56fcdbb805117a28c64'
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Safe is not deployed')
    })

    it('should fail if a transaction hash is approved by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const ethAdapter = await getEthAdapter(account3.signer)
      const safeAddress = await safe.getAddress()
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ safeTransactionData })
      const hash = await safeSdk1.getTransactionHash(tx)
      await chai
        .expect(safeSdk1.approveTransactionHash(hash))
        .to.be.rejectedWith('Transaction hashes can only be approved by Safe owners')
    })

    it('should approve the transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeAddress = await safe.getAddress()
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ safeTransactionData })
      const txHash = await safeSdk1.getTransactionHash(tx)
      const txResponse = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1n)
    })

    it('should ignore a duplicated signatures', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeAddress = await safe.getAddress()
      const safeSdk1 = await Safe.create({
        ethAdapter,
        safeAddress,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ safeTransactionData })
      const txHash = await safeSdk1.getTransactionHash(tx)
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(0n)
      const txResponse1 = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse1)
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1n)
      const txResponse2 = await safeSdk1.approveTransactionHash(txHash)
      await waitSafeTxReceipt(txResponse2)
      chai.expect(await safe.approvedHashes(account1.address, txHash)).to.be.equal(1n)
    })
  })

  describe('getOwnersWhoApprovedTx', async () => {
    it('should fail if Safe is not deployed', async () => {
      const { predictedSafe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        predictedSafe,
        contractNetworks
      })
      const txHash = '0xcbf14050c5fcc9b71d4a3ab874cc728db101d19d4466d56fcdbb805117a28c64'
      const ownersWhoApproved = safeSdk1.getOwnersWhoApprovedTx(txHash)
      chai.expect(ownersWhoApproved).to.be.rejectedWith('Safe is not deployed')
    })

    it('should return the list of owners who approved a transaction hash', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeAddress = await safe.getAddress()
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safeAddress,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk1.createTransaction({ safeTransactionData })
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
