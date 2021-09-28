import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import {
  ContractNetworksConfig,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactory
} from '../src'
import { getFactory, getMultiSend, getSafeSingleton } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe Proxy Factory', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: {
        multiSendAddress: (await getMultiSend()).address,
        safeMasterCopyAddress: (await getSafeSingleton()).address,
        safeProxyFactoryAddress: (await getFactory()).address
      }
    }
    return {
      chainId: (await waffle.provider.getNetwork()).chainId,
      accounts,
      contractNetworks
    }
  })

  describe('create', async () => {
    it('should fail if the current network is not a default network and no contractNetworks is provided', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      chai
        .expect(SafeFactory.create({ ethAdapter }))
        .rejectedWith('Safe contracts not found in the current network')
    })

    it('should instantiate the Safe Proxy Factory', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const networkId = await ethAdapter.getChainId()
      chai
        .expect(safeFactory.getAddress())
        .to.be.eq(contractNetworks[networkId].safeProxyFactoryAddress)
    })
  })

  describe('getEthAdapter', async () => {
    it('should return the connected EthAdapter', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      chai
        .expect(await safeFactory.getEthAdapter().getSignerAddress())
        .to.be.eq(await account1.signer.getAddress())
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of the current network', async () => {
      const { accounts, chainId, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      chai.expect(await safeFactory.getChainId()).to.be.eq(chainId)
    })
  })

  describe('deploySafe', async () => {
    it('should fail if there are no owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners: string[] = []
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      chai
        .expect(safeFactory.deploySafe(safeAccountConfig))
        .rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const threshold = 0
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      chai
        .expect(safeFactory.deploySafe(safeAccountConfig))
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the threshold', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const threshold = 3
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      chai
        .expect(safeFactory.deploySafe(safeAccountConfig))
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should deploy a new Safe without saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const safe = await safeFactory.deploySafe(safeAccountConfig)
      const contractCodeFinal = ethAdapter.getContractCode(safe.getAddress())
      chai.expect(contractCodeFinal).to.not.be.eq('0x')
      const deployedSafeOwners = await safe.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      const deployedSafeThreshold = await safe.getThreshold()
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
    })

    it('should deploy a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: 1 }
      const safe = await safeFactory.deploySafe(safeAccountConfig, safeDeploymentConfig)
      const contractCodeFinal = ethAdapter.getContractCode(safe.getAddress())
      chai.expect(contractCodeFinal).to.not.be.eq('0x')
      const deployedSafeOwners = await safe.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      const deployedSafeThreshold = await safe.getThreshold()
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
    })
  })
})
