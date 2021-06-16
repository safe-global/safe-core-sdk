import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber, VoidSigner } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { ContractNetworksConfig, EthersAdapter } from '../src'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      chainId: (await waffle.provider.getNetwork()).chainId,
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('connect', async () => {
    it('should fail if Safe contract is not deployed', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      await chai
        .expect(
          EthersSafe.create({
            ethAdapter,
            safeAddress: mainnetGnosisDAOSafe,
            contractNetworks
          })
        )
        .to.be.rejectedWith('Safe Proxy contract is not deployed in the current network')
    })

    it('should fail if signer is not connected to a provider', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const voidSigner = new VoidSigner(account1.address)
      await chai
        .expect(() => {
          new EthersAdapter({ ethers, providerOrSigner: voidSigner })
        })
        .to.throw('Signer must be connected to a provider')
    })

    it('should connect with signer', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      chai.expect(ethAdapter.getProvider()).to.be.eq(account1.signer.provider)
      chai.expect(ethAdapter.getSigner()).to.be.eq(account1.signer)
    })

    it('should connect with provider', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      chai.expect(ethAdapter.getProvider()).to.be.eq(account1.signer.provider)
      chai.expect(ethAdapter.getSigner()).to.be.undefined
    })

    it('should connect to Mainnet with default provider', async () => {
      const { contractNetworks } = await setupTests()
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      const ethAdapter = new EthersAdapter({ ethers })
      const defaultProvider = ethAdapter.getProvider()
      chai.expect(ethers.providers.Provider.isProvider(defaultProvider)).to.be.true
      chai.expect((await defaultProvider.getNetwork()).chainId).to.be.eq(1)
      chai.expect(ethAdapter.getSigner()).to.be.undefined
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
    })
  })

  describe('getNonce', async () => {
    it('should return the Safe nonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getNonce()).to.be.eq(0)
      const tx = await safeSdk.createTransaction({
        to: account2.address,
        value: '0',
        data: '0x'
      })
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect(await safeSdk.getNonce()).to.be.eq(1)
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of the current network', async () => {
      const { safe, accounts, chainId, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({ ethers, providerOrSigner: account1.signer })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
  })
})
