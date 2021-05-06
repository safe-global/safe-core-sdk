import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber, VoidSigner } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { GnosisSafe } from '../typechain'
import { getMultiSend, getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  chainId: number
  contractNetworks: ContractNetworksConfig
}

describe('Safe Core SDK', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address, user2.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, chainId, contractNetworks }
    }
  )

  describe('connect', async () => {
    it('should fail if signer is not connected to a provider', async () => {
      const { safe, contractNetworks } = await setupTests()
      const voidSigner = new VoidSigner(user1.address)
      await chai
        .expect(
          EthersSafe.create({
            ethers,
            safeAddress: safe.address,
            providerOrSigner: voidSigner,
            contractNetworks
          })
        )
        .to.be.rejectedWith('Signer must be connected to a provider')
    })

    it('should connect with signer', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.eq(user1)
    })

    it('should connect with provider', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1.provider,
        contractNetworks
      })
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })

    it('should connect to Mainnet with default provider', async () => {
      const { contractNetworks } = await setupTests()
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: mainnetGnosisDAOSafe,
        contractNetworks
      })
      const defaultProvider = safeSdk.getProvider()
      chai.expect(ethers.providers.Provider.isProvider(defaultProvider)).to.be.true
      chai.expect((await defaultProvider.getNetwork()).chainId).to.be.eq(1)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getSafeAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(safeSdk.getSafeAddress()).to.be.eq(safe.address)
    })
  })

  describe('getNonce', async () => {
    it('should return the Safe nonce', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(await safeSdk.getNonce()).to.be.eq(0)
      const tx = await safeSdk.createTransaction([
        {
          to: user2.address,
          value: '0',
          data: '0x'
        }
      ])
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect(await safeSdk.getNonce()).to.be.eq(1)
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of the current network', async () => {
      const { safe, chainId, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
  })
})
