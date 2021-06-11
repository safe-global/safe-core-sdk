import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, waffle } from 'hardhat'
import EthersSafe, { ContractNetworksConfig, EthersAdapter } from '../src'
import { defaultContractNetworks } from '../src/configuration/contracts'
import { ZERO_ADDRESS } from '../src/utils/constants'
import { getAccounts } from './utils/setupConfig'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
chai.use(chaiAsPromised)

describe('Safe contracts manager', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks,
      chainId
    }
  })

  describe('create', async () => {
    it('should fail if the current network is not a default network and no contractNetworks is provided', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      await chai
        .expect(
          EthersSafe.create({
            ethAdapter,
            safeAddress: safe.address
          })
        )
        .to.be.rejectedWith('Safe contracts not found in the current network')
    })

    it('should fail if Safe Proxy contract is not deployed in the current network', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      await chai
        .expect(
          EthersSafe.create({
            ethAdapter,
            safeAddress: ZERO_ADDRESS,
            contractNetworks
          })
        )
        .to.be.rejectedWith('Safe Proxy contract is not deployed in the current network')
    })

    it('should fail if MultiSend contract is specified in contractNetworks but not deployed', async () => {
      const { safe, accounts, chainId } = await setupTests()
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: ZERO_ADDRESS }
      }
      const [account1] = accounts
      const ethAdapter = new EthersAdapter({
        ethers,
        providerOrSigner: account1.signer.provider
      })
      await chai
        .expect(
          EthersSafe.create({
            ethAdapter,
            safeAddress: safe.address,
            contractNetworks
          })
        )
        .to.be.rejectedWith('MultiSend contract is not deployed in the current network')
    })

    it('should set default MultiSend contract', async () => {
      const mainnetGnosisDAOSafe = '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe'
      const ethAdapter = new EthersAdapter({ ethers })
      const safeSdk = await EthersSafe.create({
        ethAdapter,
        safeAddress: mainnetGnosisDAOSafe
      })
      chai
        .expect(safeSdk.getMultiSendAddress())
        .to.be.eq(defaultContractNetworks[1].multiSendAddress)
    })

    it('should set the MultiSend contract available in the current network', async () => {
      const { safe, accounts, chainId, contractNetworks } = await setupTests()
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
      chai
        .expect(safeSdk.getMultiSendAddress())
        .to.be.eq(contractNetworks[chainId].multiSendAddress)
    })
  })
})
