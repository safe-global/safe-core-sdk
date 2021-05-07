import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { GnosisSafe } from '../typechain'
import { getMultiSend, getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  contractNetworks: ContractNetworksConfig
}

describe('Safe Threshold', () => {
  const [user1, user2] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, contractNetworks }
    }
  )

  describe('getThreshold', async () => {
    it('should return the Safe threshold', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(await safeSdk.getThreshold()).to.be.eq(1)
    })
  })

  describe('getChangeThresholdTx', async () => {
    it('should fail if the threshold is bigger than the number of owners', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const newThreshold = 2
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners)
      await chai
        .expect(safeSdk.getChangeThresholdTx(newThreshold))
        .to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const newThreshold = 0
      await chai
        .expect(safeSdk.getChangeThresholdTx(newThreshold))
        .to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should change the threshold', async () => {
      const { contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address, user2.address], 1)
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const newThreshold = 2
      chai.expect(await safeSdk.getThreshold()).to.be.not.eq(newThreshold)
      const tx = await safeSdk.getChangeThresholdTx(newThreshold)
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect(await safeSdk.getThreshold()).to.be.eq(newThreshold)
    })
  })
})
