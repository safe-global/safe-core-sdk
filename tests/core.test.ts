import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    return {
      safe: await getSafeWithOwners([user1.address, user2.address]),
      chainId: (await waffle.provider.getNetwork()).chainId
    }
  })

  describe('connect', async () => {
    it('connect signer', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.eq(user1)
    })

    it('connect provider', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1.provider)
      chai.expect(safeSdk.getProvider()).to.be.eq(user1.provider)
      chai.expect(safeSdk.getSigner()).to.be.undefined
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
    })
  })

  describe('getNetworkId', async () => {
    it('should return the chainId of the current network', async () => {
      const { safe, chainId } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.getNetworkId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe } = await setupTests()
      const safeSdk = new EthersSafe(ethers, safe.address, user1)
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await user1.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
  })
})
