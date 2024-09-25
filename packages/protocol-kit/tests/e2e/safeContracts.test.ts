import {
  setupTests,
  getCompatibilityFallbackHandler,
  getCreateCall,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSignMessageLib,
  getSimulateTxAccessor,
  getSafeWebAuthnSignerFactory,
  getSafeWebAuthnSharedSigner
} from '@safe-global/testing-kit'
import { SafeVersion } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider, getSafeProviderFromNetwork } from './utils/setupProvider'
import {
  getCompatibilityFallbackHandlerContract,
  getCreateCallContract,
  getMultiSendCallOnlyContract,
  getMultiSendContract,
  getSafeContract,
  getSafeProxyFactoryContract,
  getSignMessageLibContract,
  SafeProvider
} from '@safe-global/protocol-kit/index'
import {
  getSafeWebAuthnSharedSignerContract,
  getSafeWebAuthnSignerFactoryContract,
  getSimulateTxAccessorContract
} from '@safe-global/protocol-kit/contracts/safeDeploymentContracts'

chai.use(chaiAsPromised)

describe('Safe contracts', () => {
  const provider = getEip1193Provider()

  describe('getSafeContract', async () => {
    it('should return an L1 Safe contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion
      })
      chai.expect(safeContract.getAddress()).to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return an L2 Safe contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('gnosis')
      const safeVersion: SafeVersion = '1.3.0'
      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion
      })
      chai.expect(safeContract.getAddress()).to.be.eq('0x3E5c63644E683549055b9Be8653de26E0B4CD36E')
    })

    it('should return an L1 Safe contract from safe-deployments using the L1 flag', async () => {
      const safeProvider = getSafeProviderFromNetwork('gnosis')
      const safeVersion: SafeVersion = '1.3.0'
      const isL1SafeSingleton = true
      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion,
        isL1SafeSingleton
      })
      chai.expect(safeContract.getAddress()).to.be.eq('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552')
    })

    it('should return an L1 Safe contract from safe-deployments when the safeVersion is < 1.3.0', async () => {
      const safeProvider = getSafeProviderFromNetwork('gnosis')
      const safeVersion: SafeVersion = '1.1.1'
      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion
      })
      chai.expect(safeContract.getAddress()).to.be.eq('0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F')
    })

    it('should return a Safe contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const safeContract = await getSafeContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai.expect(safeContract.getAddress()).to.be.eq((await getSafeSingleton()).contract.address)
    })
  })

  describe('getSafeProxyFactoryContract', async () => {
    it('should return a SafeProxyFactory contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const factoryContract = await getSafeProxyFactoryContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(factoryContract.getAddress())
        .to.be.eq('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2')
    })

    it('should return a SafeProxyFactory contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const factoryContract = await getSafeProxyFactoryContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai.expect(factoryContract.getAddress()).to.be.eq((await getFactory()).contract.address)
    })
  })

  describe('getCompatibilityFallbackHandlerContract', async () => {
    it('should return a CompatibilityFallbackHandler contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq('0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4')
    })

    it('should return a CompatibilityFallbackHandler contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const compatibilityFallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(compatibilityFallbackHandlerContract.getAddress())
        .to.be.eq((await getCompatibilityFallbackHandler()).contract.address)
    })
  })

  describe('getMultiSendContract', async () => {
    it('should return a MultiSend contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const multiSendContract = await getMultiSendContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(multiSendContract.getAddress())
        .to.be.eq('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })

    it('should return a MultiSend contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const multiSendContract = await getMultiSendContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai.expect(multiSendContract.getAddress()).to.be.eq((await getMultiSend()).contract.address)
    })
  })

  describe('getMultiSendCallOnlyContract', async () => {
    it('should return a MultiSendCallOnly contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(multiSendCallOnlyContract.getAddress())
        .to.be.eq('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D')
    })

    it('should return a MultiSendCallOnly contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const multiSendCallOnlyContract = await getMultiSendCallOnlyContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(multiSendCallOnlyContract.getAddress())
        .to.be.eq((await getMultiSendCallOnly()).contract.address)
    })
  })

  describe('getSignMessageLibContract', async () => {
    it('should return a SignMessageLib contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const signMessageLibContract = await getSignMessageLibContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(signMessageLibContract.getAddress())
        .to.be.eq('0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2')
    })

    it('should return a SignMessageLib contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const signMessageLibContract = await getSignMessageLibContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(signMessageLibContract.getAddress())
        .to.be.eq((await getSignMessageLib()).contract.address)
    })
  })

  describe('getCreateCallContract', async () => {
    it('should return a CreateCall contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const createCallContract = await getCreateCallContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(createCallContract.getAddress())
        .to.be.eq('0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4')
    })

    it('should return a CreateCall contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const createCallContract = await getCreateCallContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(createCallContract.getAddress())
        .to.be.eq((await getCreateCall()).contract.address)
    })
  })

  describe('getSimulateTxAccessorContract', async () => {
    it('should return a SimulateTxAccessor contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const simulateTxAccessorContract = await getSimulateTxAccessorContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(simulateTxAccessorContract.getAddress())
        .to.be.eq('0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da')
    })

    it('should return a SimulateTxAccessor contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const simulateTxAccessorContract = await getSimulateTxAccessorContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(simulateTxAccessorContract.getAddress())
        .to.be.eq((await getSimulateTxAccessor()).contract.address)
    })
  })

  describe('getSafeWebAuthnSignerFactoryContract', async () => {
    it('should return a SafeWebAuthnSignerFactory contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(safeWebAuthnSignerFactoryContract.getAddress())
        .to.be.eq('0x1d31F259eE307358a26dFb23EB365939E8641195')
    })

    it('should return a SafeWebAuthnSignerFactory contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const safeWebAuthnSignerFactoryContract = await getSafeWebAuthnSignerFactoryContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(safeWebAuthnSignerFactoryContract.getAddress())
        .to.be.eq((await getSafeWebAuthnSignerFactory()).contract.address)
    })
  })

  describe('getSafeWebAuthnSharedSignerContract', async () => {
    it('should return a SafeWebAuthnSharedSigner contract from safe-deployments', async () => {
      const safeProvider = getSafeProviderFromNetwork('mainnet')
      const safeVersion: SafeVersion = '1.3.0'
      const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContract({
        safeProvider,
        safeVersion
      })
      chai
        .expect(safeWebAuthnSharedSignerContract.getAddress())
        .to.be.eq('0x94a4F6affBd8975951142c3999aEAB7ecee555c2')
    })

    it('should return a SafeWebAuthnSharedSigner contract from the custom addresses', async () => {
      const { contractNetworks, chainId } = await setupTests()
      const safeProvider = new SafeProvider({ provider })
      const safeVersion: SafeVersion = '1.3.0'
      const customContracts = contractNetworks[chainId.toString()]
      const safeWebAuthnSharedSignerContract = await getSafeWebAuthnSharedSignerContract({
        safeProvider,
        safeVersion,
        customContracts
      })
      chai
        .expect(safeWebAuthnSharedSignerContract.getAddress())
        .to.be.eq((await getSafeWebAuthnSharedSigner()).contract.address)
    })
  })
})
