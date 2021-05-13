import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber, VoidSigner } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { getAccounts } from './utils/setupConfig'
import { getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    return {
      chainId: (await waffle.provider.getNetwork()).chainId,
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts
    }
  })

  describe('connect', async () => {
    it('should fail if Safe contract is not deployed', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      await chai
        .expect(EthersSafe.create(ethers, mainnetGnosisDAOSafe, account1.signer.provider))
        .to.be.rejectedWith('Safe contract is not deployed in the current network')
    })

    it('should fail if signer is not connected to a provider', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const voidSigner = new VoidSigner(account1.address)
      await chai
        .expect(EthersSafe.create(ethers, safe.address, voidSigner))
        .to.be.rejectedWith('Signer must be connected to a provider')
    })

    it('should connect with signer', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
      chai.expect(safeSdk.getProvider()).to.be.eq(account1.signer.provider)
      chai.expect(safeSdk.getSigner()).to.be.eq(account1.signer)
    })

    it('should connect with provider', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer.provider)
      chai.expect(safeSdk.getProvider()).to.be.eq(account1.signer.provider)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })

    it('should connect to Mainnet with default provider', async () => {
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      const safeSdk = await EthersSafe.create(ethers, mainnetGnosisDAOSafe)
      const defaultProvider = safeSdk.getProvider()
      chai.expect(ethers.providers.Provider.isProvider(defaultProvider)).to.be.true
      chai.expect((await defaultProvider.getNetwork()).chainId).to.be.eq(1)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
    })
  })

  describe('getNonce', async () => {
    it('should return the Safe nonce', async () => {
      const { accounts } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
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
      const { safe, accounts, chainId } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const safeSdk = await EthersSafe.create(ethers, safe.address, account1.signer)
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
  })
})
