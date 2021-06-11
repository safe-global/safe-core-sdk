import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe, { ContractNetworksConfig, EthersAdapter } from '../src'
import { getAccounts } from './utils/setupConfig'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('Off-chain signatures', () => {
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

  describe('signTransactionHash', async () => {
    it('should fail if signer is not provided', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account3.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = await safeSdk.createTransaction({
        to: safe.address,
        value: '0',
        data: '0x'
      })
      await chai.expect(safeSdk.signTransaction(tx)).to.be.rejectedWith('No signer provided')
    })

    it('should fail if signature is added by an account that is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const account3 = accounts[2]
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account3.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
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
