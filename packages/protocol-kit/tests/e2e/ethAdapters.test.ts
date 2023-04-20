import {
  getCompatibilityFallbackHandlerContractDeployment,
  getCreateCallContractDeployment,
  getMultiSendCallOnlyContractDeployment,
  getMultiSendContractDeployment,
  getSafeContractDeployment,
  getSafeProxyFactoryContractDeployment,
  getSignMessageLibContractDeployment
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getCompatibilityFallbackHandler,
  getCreateCall,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSignMessageLib
} from './utils/setupContracts'
import { getEthAdapter, getNetworkProvider } from './utils/setupEthAdapter'
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
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getSafeContractDeployment(safeVersion, chainId)
      const safeContract = await ethAdapter.getSafeContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return an L2 Safe contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('gnosis'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 100
      const singletonDeployment = getSafeContractDeployment(safeVersion, chainId)
      const safeContract = await ethAdapter.getSafeContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0x3E5c63644E683549055b9Be8653de26E0B4CD36E')
    })

    it('should return an L1 Safe contract from safe-deployments using the L1 flag', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('gnosis'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 100
      const isL1SafeMasterCopy = true
      const singletonDeployment = getSafeContractDeployment(
        safeVersion,
        chainId,
        isL1SafeMasterCopy
      )
      const safeContract = await ethAdapter.getSafeContract({
        safeVersion,
        singletonDeployment
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
        customContractAddress: customContract?.safeMasterCopyAddress,
        customContractAbi: customContract?.safeMasterCopyAbi
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq((await getSafeSingleton()).contract.address)
    })
  })

  describe('getMultiSendContract', async () => {
    it('should return a MultiSend contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getMultiSendContractDeployment(safeVersion, chainId)
      const multiSendContract = await ethAdapter.getMultiSendContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })

    it('should return a MultiSend contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const multiSendContract = await ethAdapter.getMultiSendContract({
        safeVersion,
        customContractAddress: customContract.multiSendAddress,
        customContractAbi: customContract.multiSendAbi
      })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq((await getMultiSend()).contract.address)
    })
  })

  describe('getMultiSendCallOnlyContract', async () => {
    it('should return a MultiSendCallOnly contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getMultiSendCallOnlyContractDeployment(safeVersion, chainId)
      const multiSendCallOnlyContract = await ethAdapter.getMultiSendCallOnlyContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await multiSendCallOnlyContract.getAddress())
        .to.be.eq('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D')
    })

    it('should return a MultiSendCallOnly contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const multiSendCallOnlyContract = await ethAdapter.getMultiSendCallOnlyContract({
        safeVersion,
        customContractAddress: customContract.multiSendCallOnlyAddress,
        customContractAbi: customContract.multiSendCallOnlyAbi
      })
      chai
        .expect(await multiSendCallOnlyContract.getAddress())
        .to.be.eq((await getMultiSendCallOnly()).contract.address)
    })
  })

  describe('getCompatibilityFallbackHandlerContract', async () => {
    it('should return a CompatibilityFallbackHandler contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getCompatibilityFallbackHandlerContractDeployment(
        safeVersion,
        chainId
      )
      const compatibilityFallbackHandlerContract =
        await ethAdapter.getCompatibilityFallbackHandlerContract({
          safeVersion,
          singletonDeployment
        })
      chai
        .expect(await compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq('0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4')
    })

    it('should return a CompatibilityFallbackHandler contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const compatibilityFallbackHandlerContract =
        await ethAdapter.getCompatibilityFallbackHandlerContract({
          safeVersion,
          customContractAddress: customContract.fallbackHandlerAddress,
          customContractAbi: customContract.fallbackHandlerAbi
        })
      chai
        .expect(await compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq((await getCompatibilityFallbackHandler()).contract.address)
    })
  })

  describe('getSafeProxyFactoryContract', async () => {
    it('should return a SafeProxyFactory contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getSafeProxyFactoryContractDeployment(safeVersion, chainId)
      const factoryContract = await ethAdapter.getSafeProxyFactoryContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2')
    })

    it('should return a SafeProxyFactory contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const factoryContract = await ethAdapter.getSafeProxyFactoryContract({
        safeVersion,
        customContractAddress: customContract.safeProxyFactoryAddress,
        customContractAbi: customContract.safeProxyFactoryAbi
      })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq((await getFactory()).contract.address)
    })
  })

  describe('getSignMessageLibContract', async () => {
    it('should return a SignMessageLib contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getSignMessageLibContractDeployment(safeVersion, chainId)
      const signMessageLibContract = await ethAdapter.getSignMessageLibContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await signMessageLibContract.getAddress())
        .to.be.eq('0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2')
    })

    it('should return a SignMessageLib contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const signMessageLibContract = await ethAdapter.getSignMessageLibContract({
        safeVersion,
        customContractAddress: customContract.signMessageLibAddress,
        customContractAbi: customContract.signMessageLibAbi
      })
      chai
        .expect(await signMessageLibContract.getAddress())
        .to.be.eq((await getSignMessageLib()).contract.address)
    })
  })

  describe('getCreateCallContract', async () => {
    it('should return a CreateCall contract from safe-deployments', async () => {
      const ethAdapter = await getEthAdapter(getNetworkProvider('mainnet'))
      const safeVersion: SafeVersion = '1.3.0'
      const chainId = 1
      const singletonDeployment = getCreateCallContractDeployment(safeVersion, chainId)
      const createCallContract = await ethAdapter.getCreateCallContract({
        safeVersion,
        singletonDeployment
      })
      chai
        .expect(await createCallContract.getAddress())
        .to.be.eq('0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4')
    })

    it('should return a SafeProxyFactory contract from the custom addresses', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId]
      const createCallContract = await ethAdapter.getCreateCallContract({
        safeVersion,
        customContractAddress: customContract.createCallAddress,
        customContractAbi: customContract.createCallAbi
      })
      chai
        .expect(await createCallContract.getAddress())
        .to.be.eq((await getCreateCall()).contract.address)
    })
  })
})
