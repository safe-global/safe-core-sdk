import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { SafeVersion } from '../src'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getFactory, getMultiSend, getSafeSingleton } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe contracts', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      accounts,
      contractNetworks,
      chainId
    }
  })

  describe('getSafeContract', async () => {
    it('should return an L1 Safe contract from safe-deployments', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const safeContract = await ethAdapter.getSafeContract({ safeVersion, chainId })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return an L2 Safe contract from safe-deployments', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 100
      const safeContract = await ethAdapter.getSafeContract({ safeVersion, chainId })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0x3E5c63644E683549055b9Be8653de26E0B4CD36E')
    })

    it('should return an L1 Safe contract from safe-deployments using the L1 flag', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 100
      const isL1SafeMasterCopy = true
      const safeContract = await ethAdapter.getSafeContract({
        safeVersion,
        chainId,
        isL1SafeMasterCopy
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return a Safe contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const safeContract = await ethAdapter.getSafeContract({
        safeVersion,
        chainId,
        customContractAddress: customContract?.safeMasterCopyAddress,
        customContractAbi: customContract?.safeMasterCopyAbi
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq((await getSafeSingleton()).contract.address)
    })
  })

  describe('getMultiSendContract', async () => {
    it('should return a Multi Send contract from safe-deployments', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const multiSendContract = await ethAdapter.getMultiSendContract({ safeVersion, chainId })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })

    it('should return a Multi Send contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const multiSendContract = await ethAdapter.getMultiSendContract({
        safeVersion,
        chainId,
        customContractAddress: customContract.multiSendAddress,
        customContractAbi: customContract.multiSendAbi
      })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq((await getMultiSend()).contract.address)
    })
  })

  describe('getSafeProxyFactoryContract', async () => {
    it('should return a Safe Proxy Factory contract from safe-deployments', async () => {
      const { accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const factoryContract = await ethAdapter.getSafeProxyFactoryContract({ safeVersion, chainId })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2')
    })

    it('should return a Safe Proxy Factory contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const factoryContract = await ethAdapter.getSafeProxyFactoryContract({
        safeVersion,
        chainId,
        customContractAddress: customContract.safeProxyFactoryAddress,
        customContractAbi: customContract.safeProxyFactoryAbi
      })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq((await getFactory()).contract.address)
    })
  })
})
