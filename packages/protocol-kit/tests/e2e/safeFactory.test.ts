import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import {
  ContractNetworksConfig,
  DeploySafeProps,
  SafeAccountConfig,
  SafeFactory
} from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getCompatibilityFallbackHandler,
  getCreateCall,
  getDefaultCallbackHandler,
  getFactory,
  getMultiSend,
  getMultiSendCallOnly,
  getSafeSingleton,
  getSignMessageLib
} from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('SafeProxyFactory', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      defaultCallbackHandler: await getDefaultCallbackHandler(),
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
        .rejectedWith('Invalid SafeProxyFactory contract')
    })

    it('should fail if the contractNetworks provided are not deployed', async () => {
      const { accounts, chainId } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: {
          safeMasterCopyAddress: ZERO_ADDRESS,
          safeMasterCopyAbi: (await getSafeSingleton()).abi,
          safeProxyFactoryAddress: ZERO_ADDRESS,
          safeProxyFactoryAbi: (await getFactory()).abi,
          multiSendAddress: ZERO_ADDRESS,
          multiSendAbi: (await getMultiSend()).abi,
          multiSendCallOnlyAddress: ZERO_ADDRESS,
          multiSendCallOnlyAbi: (await getMultiSendCallOnly()).abi,
          fallbackHandlerAddress: ZERO_ADDRESS,
          fallbackHandlerAbi: (await getCompatibilityFallbackHandler()).abi,
          signMessageLibAddress: ZERO_ADDRESS,
          signMessageLibAbi: (await getSignMessageLib()).abi,
          createCallAddress: ZERO_ADDRESS,
          createCallAbi: (await getCreateCall()).abi
        }
      }
      chai
        .expect(SafeFactory.create({ ethAdapter, contractNetworks }))
        .rejectedWith('SafeProxyFactory contract is not deployed on the current network')
    })

    it('should instantiate the SafeProxyFactory', async () => {
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

  describe('predictSafeAddress', async () => {
    it('should fail if there are no owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners: string[] = []
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '1'

      await chai
        .expect(safeFactory.predictSafeAddress(safeAccountConfig, saltNonce))
        .rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const invalidThreshold = 0
      const safeAccountConfig: SafeAccountConfig = { owners, threshold: invalidThreshold }
      const saltNonce = '1'

      await chai
        .expect(safeFactory.predictSafeAddress(safeAccountConfig, saltNonce))
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the threshold', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
      const owners = [account1.address, account2.address]
      const invalidThreshold = 3
      const safeAccountConfig: SafeAccountConfig = { owners, threshold: invalidThreshold }
      const saltNonce = '1'

      await chai
        .expect(safeFactory.predictSafeAddress(safeAccountConfig, saltNonce))
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const invalidSaltNonce = '-1'

      await chai
        .expect(safeFactory.predictSafeAddress(safeAccountConfig, invalidSaltNonce))
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    it('should predict a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '12345'
      const counterfactualSafeAddress = await safeFactory.predictSafeAddress(
        safeAccountConfig,
        saltNonce
      )
      const deploySafeProps: DeploySafeProps = { safeAccountConfig, saltNonce }
      const safe = await safeFactory.deploySafe(deploySafeProps)
      chai.expect(counterfactualSafeAddress).to.be.eq(await safe.getAddress())
      chai.expect(threshold).to.be.eq(await safe.getThreshold())
      const deployedSafeOwners = await safe.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should predict a new Safe with the default CompatibilityFallbackHandler',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeFactory = await SafeFactory.create({
          ethAdapter,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }
        const saltNonce = '12345'
        const counterfactualSafeAddress = await safeFactory.predictSafeAddress(
          safeAccountConfig,
          saltNonce
        )
        const deploySafeProps: DeploySafeProps = { safeAccountConfig, saltNonce }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        chai.expect(counterfactualSafeAddress).to.be.eq(await safe.getAddress())
        const compatibilityFallbackHandler = (await getCompatibilityFallbackHandler()).contract
          .address
        chai.expect(compatibilityFallbackHandler).to.be.eq(await safe.getFallbackHandler())
      }
    )

    itif(safeVersionDeployed > '1.0.0')(
      'should predict a new Safe with a custom fallback handler',
      async () => {
        const { accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
        const [account1, account2] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeFactory = await SafeFactory.create({
          ethAdapter,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold,
          fallbackHandler: defaultCallbackHandler.address
        }
        const saltNonce = '12345'
        const counterfactualSafeAddress = await safeFactory.predictSafeAddress(
          safeAccountConfig,
          saltNonce
        )
        const deploySafeProps: DeploySafeProps = { safeAccountConfig, saltNonce }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        chai.expect(counterfactualSafeAddress).to.be.eq(await safe.getAddress())
        chai.expect(defaultCallbackHandler.address).to.be.eq(await safe.getFallbackHandler())
      }
    )
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
      const safeDeployProps: DeploySafeProps = { safeAccountConfig }
      await chai
        .expect(safeFactory.deploySafe(safeDeployProps))
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
      const safeDeployProps: DeploySafeProps = { safeAccountConfig }
      await chai
        .expect(safeFactory.deploySafe(safeDeployProps))
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
      const deploySafeProps: DeploySafeProps = { safeAccountConfig }
      await chai
        .expect(safeFactory.deploySafe(deploySafeProps))
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const invalidSaltNonce = '-1'
      const safeDeployProps: DeploySafeProps = { safeAccountConfig, saltNonce: invalidSaltNonce }
      await chai
        .expect(safeFactory.deploySafe(safeDeployProps))
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should deploy a new Safe with custom fallback handler',
      async () => {
        const { accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
        const [account1, account2] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeFactory = await SafeFactory.create({
          ethAdapter,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold,
          fallbackHandler: defaultCallbackHandler.address
        }
        const deploySafeProps: DeploySafeProps = { safeAccountConfig }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        const deployedSafeOwners = await safe.getOwners()
        chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
        const deployedSafeThreshold = await safe.getThreshold()
        chai.expect(deployedSafeThreshold).to.be.eq(threshold)
        const fallbackHandler = await safe.getFallbackHandler()
        chai.expect(defaultCallbackHandler.address).to.be.eq(fallbackHandler)
      }
    )

    itif(safeVersionDeployed > '1.0.0')(
      'should deploy a new Safe with the default CompatibilityFallbackHandler',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeFactory = await SafeFactory.create({
          ethAdapter,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }
        const deploySafeProps: DeploySafeProps = { safeAccountConfig }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        const fallbackHandler = await safe.getFallbackHandler()
        const compatibilityFallbackHandler = (await getCompatibilityFallbackHandler()).contract
          .address
        chai.expect(compatibilityFallbackHandler).to.be.eq(fallbackHandler)
      }
    )

    it('should deploy a new Safe without saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const deploySafeProps: DeploySafeProps = { safeAccountConfig }
      const safe = await safeFactory.deploySafe(deploySafeProps)
      const deployedSafeOwners = await safe.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      const deployedSafeThreshold = await safe.getThreshold()
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
    })

    it('should deploy a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '1'
      const deploySafeProps: DeploySafeProps = { safeAccountConfig, saltNonce }
      const safe = await safeFactory.deploySafe(deploySafeProps)
      const deployedSafeOwners = await safe.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      const deployedSafeThreshold = await safe.getThreshold()
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
    })

    it('should deploy a new Safe with callback', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      let callbackResult = ''
      const callback = (txHash: string) => {
        callbackResult = txHash
      }
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const deploySafeProps: DeploySafeProps = { safeAccountConfig, callback }
      chai.expect(callbackResult).to.be.empty
      const safe = await safeFactory.deploySafe(deploySafeProps)
      chai.expect(callbackResult).to.be.not.empty
      const safeInstanceVersion = await safe.getContractVersion()
      chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
    })

    itif(safeVersionDeployed === DEFAULT_SAFE_VERSION)(
      'should deploy last Safe version by default',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }
        const deploySafeProps: DeploySafeProps = { safeAccountConfig }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        const safeInstanceVersion = await safe.getContractVersion()
        chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
      }
    )

    it('should deploy a specific Safe version', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeFactory = await SafeFactory.create({
        ethAdapter,
        safeVersion: safeVersionDeployed,
        contractNetworks
      })
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const deploySafeProps: DeploySafeProps = { safeAccountConfig }
      const safe = await safeFactory.deploySafe(deploySafeProps)
      const safeInstanceVersion = await safe.getContractVersion()
      chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
    })
  })
})
