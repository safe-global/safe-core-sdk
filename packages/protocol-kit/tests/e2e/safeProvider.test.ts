import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
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
import { getEip1193Provider, getSafeProviderFromNetwork } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { SafeProvider } from '@safe-global/protocol-kit/index'
import { AbstractSigner, BrowserProvider, JsonRpcProvider } from 'ethers'

chai.use(chaiAsPromised)

describe('Safe contracts', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()

    return {
      accounts,
      contractNetworks,
      chainId,
      provider
    }
  })

  describe('getSafeContract', async () => {
    it('should return an L1 Safe contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const safeContract = await safeProvider.getSafeContract({
        safeVersion
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return an L2 Safe contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('gnosis')
      const safeVersion: SafeVersion = '1.3.0'
      const safeContract = await safeProvider.getSafeContract({
        safeVersion
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0x3E5c63644E683549055b9Be8653de26E0B4CD36E')
    })

    it('should return an L1 Safe contract from safe-deployments using the L1 flag', async () => {
      const safeProvider = getSafeProviderFromNetwork('gnosis')
      const safeVersion: SafeVersion = '1.3.0'
      const isL1SafeSingleton = true
      const safeContract = await safeProvider.getSafeContract({
        safeVersion,
        isL1SafeSingleton
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return a Safe contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const safeContract = await safeProvider.getSafeContract({
        safeVersion,
        customContractAddress: customContract?.safeSingletonAddress,
        customContractAbi: customContract?.safeSingletonAbi
      })
      chai
        .expect(await safeContract.getAddress())
        .to.be.eq(await (await getSafeSingleton()).contract.getAddress())
    })
  })

  describe('getMultiSendContract', async () => {
    it('should return a MultiSend contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const multiSendContract = await safeProvider.getMultiSendContract({
        safeVersion
      })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })

    it('should return a MultiSend contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const multiSendContract = await safeProvider.getMultiSendContract({
        safeVersion,
        customContractAddress: customContract.multiSendAddress,
        customContractAbi: customContract.multiSendAbi
      })
      chai
        .expect(await multiSendContract.getAddress())
        .to.be.eq(await (await getMultiSend()).contract.getAddress())
    })
  })

  describe('getMultiSendCallOnlyContract', async () => {
    it('should return a MultiSendCallOnly contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const multiSendCallOnlyContract = await safeProvider.getMultiSendCallOnlyContract({
        safeVersion
      })
      chai
        .expect(await multiSendCallOnlyContract.getAddress())
        .to.be.eq('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D')
    })

    it('should return a MultiSendCallOnly contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const multiSendCallOnlyContract = await safeProvider.getMultiSendCallOnlyContract({
        safeVersion,
        customContractAddress: customContract.multiSendCallOnlyAddress,
        customContractAbi: customContract.multiSendCallOnlyAbi
      })
      chai
        .expect(await multiSendCallOnlyContract.getAddress())
        .to.be.eq(await (await getMultiSendCallOnly()).contract.getAddress())
    })
  })

  describe('getCompatibilityFallbackHandlerContract', async () => {
    it('should return a CompatibilityFallbackHandler contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const compatibilityFallbackHandlerContract =
        await safeProvider.getCompatibilityFallbackHandlerContract({
          safeVersion
        })
      chai
        .expect(await compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq('0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4')
    })

    it('should return a CompatibilityFallbackHandler contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const compatibilityFallbackHandlerContract =
        await safeProvider.getCompatibilityFallbackHandlerContract({
          safeVersion,
          customContractAddress: customContract.fallbackHandlerAddress,
          customContractAbi: customContract.fallbackHandlerAbi
        })
      chai
        .expect(await compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq(await (await getCompatibilityFallbackHandler()).contract.getAddress())
    })
  })

  describe('getSafeProxyFactoryContract', async () => {
    it('should return a SafeProxyFactory contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const factoryContract = await safeProvider.getSafeProxyFactoryContract({
        safeVersion
      })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2')
    })

    it('should return a SafeProxyFactory contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const factoryContract = await safeProvider.getSafeProxyFactoryContract({
        safeVersion,
        customContractAddress: customContract.safeProxyFactoryAddress,
        customContractAbi: customContract.safeProxyFactoryAbi
      })
      chai
        .expect(await factoryContract.getAddress())
        .to.be.eq(await (await getFactory()).contract.getAddress())
    })
  })

  describe('getSignMessageLibContract', async () => {
    it('should return a SignMessageLib contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const signMessageLibContract = await safeProvider.getSignMessageLibContract({
        safeVersion
      })
      chai
        .expect(await signMessageLibContract.getAddress())
        .to.be.eq('0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2')
    })

    it('should return a SignMessageLib contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const signMessageLibContract = await safeProvider.getSignMessageLibContract({
        safeVersion,
        customContractAddress: customContract.signMessageLibAddress,
        customContractAbi: customContract.signMessageLibAbi
      })
      chai
        .expect(await signMessageLibContract.getAddress())
        .to.be.eq(await (await getSignMessageLib()).contract.getAddress())
    })
  })

  describe('getCreateCallContract', async () => {
    it('should return a CreateCall contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const createCallContract = await safeProvider.getCreateCallContract({
        safeVersion
      })
      chai
        .expect(await createCallContract.getAddress())
        .to.be.eq('0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4')
    })

    it('should return a SafeProxyFactory contract from the custom addresses', async () => {
      const { contractNetworks, chainId, provider } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContract = contractNetworks[chainId.toString()]
      const createCallContract = await safeProvider.getCreateCallContract({
        safeVersion,
        customContractAddress: customContract.createCallAddress,
        customContractAbi: customContract.createCallAbi
      })
      chai
        .expect(await createCallContract.getAddress())
        .to.be.eq(await (await getCreateCall()).contract.getAddress())
    })

    it('should return an external provider (BrowserProvider) and signer (AbstractSigner) when using an EIP1193 provider', async () => {
      const { provider } = await setupTests()

      const safeProvider = new SafeProvider({ provider })

      chai.expect(safeProvider.getExternalProvider()).to.be.instanceOf(BrowserProvider)
      chai.expect(await safeProvider.getExternalSigner()).to.be.instanceOf(AbstractSigner)
    })

    it('should return an external provider (JsonRpcProvider) and signer (AbstractSigner) when using a private key', async () => {
      const safeProvider = new SafeProvider({
        provider: 'https://sepolia.gateway.tenderly.co',
        signer: '4ff03ace1395691975678c93449d552dc83df6b773a8024d4c368b39042a7610'
      })

      chai.expect(safeProvider.getExternalProvider()).to.be.instanceOf(JsonRpcProvider)
      chai.expect(await safeProvider.getExternalSigner()).to.be.instanceOf(AbstractSigner)
    })

    it('should return an undefined signer when using an RPC without signer', async () => {
      const safeProvider = new SafeProvider({
        provider: 'https://sepolia.gateway.tenderly.co'
      })

      chai.expect(safeProvider.getExternalProvider()).to.be.instanceOf(JsonRpcProvider)
      chai.expect(await safeProvider.getExternalSigner()).to.be.undefined
    })
  })
})
