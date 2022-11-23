import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe from '../src'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Off-chain signatures', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('signTransactionHash', async () => {
    it('should sign a transaction hash with the current signer', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      const txHash = await safeSdk.getTransactionHash(tx)
      const signature = await safeSdk.signTransactionHash(txHash)
      chai.expect(signature.staticPart().length).to.be.eq(132)
    })
  })

  describe('signTransaction', async () => {
    it('should fail if signature is added by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const ethAdapter = await getEthAdapter(account3.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      await chai
        .expect(safeSdk.signTransaction(tx))
        .to.be.rejectedWith('Transactions can only be signed by Safe owners')
    })

    it('should add the signature of the current signer', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx = await safeSdk.signTransaction(tx)
      chai.expect(tx.signatures.size).to.be.eq(0)
      chai.expect(signedTx.signatures.size).to.be.eq(1)
    })

    it('should ignore duplicated signatures', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safe.address,
        value: '0',
        data: '0x'
      }
      const tx = await safeSdk.createTransaction({ safeTransactionData })
      chai.expect(tx.signatures.size).to.be.eq(0)
      const signedTx1 = await safeSdk.signTransaction(tx)
      chai.expect(signedTx1.signatures.size).to.be.eq(1)
      const signedTx2 = await safeSdk.signTransaction(signedTx1)
      chai.expect(signedTx2.signatures.size).to.be.eq(1)
      chai.expect(tx.signatures.size).to.be.eq(0)
    })
  })
})
