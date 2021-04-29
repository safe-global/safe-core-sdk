import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig, defaultContractNetworks } from '../src/configuration/contracts'
import { ZERO_ADDRESS } from '../src/utils/constants'
import { GnosisSafe } from '../typechain'
import { getMultiSend, getSafeWithOwners } from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  chainId: number
  contractNetworks: ContractNetworksConfig
}

describe('Safe Contracts Manager', () => {
  const [user1] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, chainId, contractNetworks }
    }
  )

  describe('init', async () => {
    it('should fail if the current network is not a default network and no contractNetworks is provided', async () => {
      const { safe } = await setupTests()
      await chai
        .expect(
          EthersSafe.create({
            ethers,
            safeAddress: safe.address,
            providerOrSigner: user1.provider
          })
        )
        .to.be.rejectedWith('Safe contracts not found in the current network')
    })

    it('should fail if Safe Proxy contract is not deployed in the current network', async () => {
      const { contractNetworks } = await setupTests()
      await chai
        .expect(
          EthersSafe.create({
            ethers,
            safeAddress: ZERO_ADDRESS,
            providerOrSigner: user1.provider,
            contractNetworks
          })
        )
        .to.be.rejectedWith('Safe Proxy contract is not deployed in the current network')
    })

    it('should fail if MultiSend contract is specified in contractNetworks but not deployed', async () => {
      const { safe, chainId } = await setupTests()
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: ZERO_ADDRESS }
      }
      await chai
        .expect(
          EthersSafe.create({
            ethers,
            safeAddress: safe.address,
            providerOrSigner: user1.provider,
            contractNetworks
          })
        )
        .to.be.rejectedWith('MultiSend contract is not deployed in the current network')
    })

    it('should use default MultiSend contract', async () => {
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      const safeSdk = await EthersSafe.create({ ethers, safeAddress: mainnetGnosisDAOSafe })
      chai
        .expect(safeSdk.getMultiSendAddress())
        .to.be.eq(defaultContractNetworks[1].multiSendAddress)
    })

    it('should use specified MultiSend contract', async () => {
      const { safe, chainId, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1.provider,
        contractNetworks
      })
      chai
        .expect(safeSdk.getMultiSendAddress())
        .to.be.eq(contractNetworks[chainId].multiSendAddress)
    })
  })
})
