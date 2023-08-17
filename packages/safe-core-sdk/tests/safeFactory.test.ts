import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { safeVersionDeployed } from '../hardhat/deploy/deploy-contracts'
import {
  ContractNetworksConfig,
  DeploySafeProps,
  PredictSafeProps,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactory
} from '../src'
import { SAFE_LAST_VERSION } from '../src/contracts/config'
import { ZERO_ADDRESS } from '../src/utils/constants'
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
import { getEthAdapter, getNetworkProvider } from './utils/setupEthAdapter'
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '1' }
      const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
      await chai
        .expect(safeFactory.predictSafeAddress(predictSafeProps))
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '1' }
      const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
      await chai
        .expect(safeFactory.predictSafeAddress(predictSafeProps))
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '1' }
      const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
      await chai
        .expect(safeFactory.predictSafeAddress(predictSafeProps))
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '-1' }
      const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
      await chai
        .expect(safeFactory.predictSafeAddress(predictSafeProps))
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '12345' }
      const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
      const counterfactualSafeAddress = await safeFactory.predictSafeAddress(predictSafeProps)
      const deploySafeProps: DeploySafeProps = { safeAccountConfig, safeDeploymentConfig }
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
        const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '12345' }
        const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
        const counterfactualSafeAddress = await safeFactory.predictSafeAddress(predictSafeProps)
        const deploySafeProps: DeploySafeProps = { safeAccountConfig, safeDeploymentConfig }
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
        const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '12345' }
        const predictSafeProps: PredictSafeProps = { safeAccountConfig, safeDeploymentConfig }
        const counterfactualSafeAddress = await safeFactory.predictSafeAddress(predictSafeProps)
        const deploySafeProps: DeploySafeProps = { safeAccountConfig, safeDeploymentConfig }
        const safe = await safeFactory.deploySafe(deploySafeProps)
        chai.expect(counterfactualSafeAddress).to.be.eq(await safe.getAddress())
        chai.expect(defaultCallbackHandler.address).to.be.eq(await safe.getFallbackHandler())
      }
    )

    itif(safeVersionDeployed === '1.3.0')(
      'returns the predicted address for Safes deployed on zkSync Era',
      async () => {
        const { contractNetworks } = await setupTests()

        // Create EthAdapter instance
        const ethAdapter = await getEthAdapter(getNetworkProvider('zksync'))
        const safeFactory = await SafeFactory.create({
          ethAdapter,
          safeVersion: safeVersionDeployed,
          contractNetworks
        })

        // We check real deployments from zksync return the expected address.

        // 1/1 Safe
        const safeAccountConfig1: SafeAccountConfig = {
          owners: ['0xc6b82bA149CFA113f8f48d5E3b1F78e933e16DfD'],
          threshold: 1
        }
        const safeDeploymentConfig1: SafeDeploymentConfig = {
          saltNonce: '1691490995332'
        }
        const expectedSafeAddress1 = '0x4e19dA81a54eFbaBeb9AD50646f7643076475D65'

        const firstPredictedSafeAddress = await safeFactory.predictSafeAddress({
          safeAccountConfig: safeAccountConfig1,
          safeDeploymentConfig: safeDeploymentConfig1
        })

        // 1/2 Safe
        const safeAccountConfig2: SafeAccountConfig = {
          owners: [
            '0x7E5E1C1FC6d625C1e60d78fDAB1CCE91e32261e4',
            '0x6994Dc2544C1137b355488A9fc7b4F6EC2Bfeb5D'
          ],
          threshold: 1
        }
        const safeDeploymentConfig2: SafeDeploymentConfig = {
          saltNonce: '1690771277826'
        }
        const expectedSafeAddress2 = '0x60c7F13dE7C8Fb88b3845e58859658bdc44243F8'

        const secondPredictedSafeAddress = await safeFactory.predictSafeAddress({
          safeAccountConfig: safeAccountConfig2,
          safeDeploymentConfig: safeDeploymentConfig2
        })

        // 2/3 Safe
        const safeAccountConfig3: SafeAccountConfig = {
          owners: [
            '0x99999A3C4cB8427c44294Ad36895b6a3A047060d',
            '0x1234561fEd41DD2D867a038bBdB857f291864225',
            '0xe2c1F5DDcc99B0D70584fB4aD9D52b49cD4Cab03'
          ],
          threshold: 2
        }
        const safeDeploymentConfig3: SafeDeploymentConfig = {
          saltNonce: '1690944491662'
        }
        const expectedSafeAddress3 = '0xD971FAA20db3ad4d51D453047ca03Ce4ec164CE2'

        const thirdPredictedSafeAddress = await safeFactory.predictSafeAddress({
          safeAccountConfig: safeAccountConfig3,
          safeDeploymentConfig: safeDeploymentConfig3
        })

        // returns the same predicted address each call
        chai.expect(firstPredictedSafeAddress).to.be.equal(expectedSafeAddress1)
        chai.expect(secondPredictedSafeAddress).to.be.equal(expectedSafeAddress2)
        chai.expect(thirdPredictedSafeAddress).to.be.equal(expectedSafeAddress3)
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '-1' }
      const safeDeployProps: DeploySafeProps = { safeAccountConfig, safeDeploymentConfig }
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
      const safeDeploymentConfig: SafeDeploymentConfig = { saltNonce: '1' }
      const deploySafeProps: DeploySafeProps = { safeAccountConfig, safeDeploymentConfig }
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

    itif(safeVersionDeployed === SAFE_LAST_VERSION)(
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
