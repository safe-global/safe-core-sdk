import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps, SafeAccountConfig } from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getCompatibilityFallbackHandler,
  getDefaultCallbackHandler,
  getFactory
} from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe Deployment', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)
    const provider = getEip1193Provider()

    return {
      defaultCallbackHandler: await getDefaultCallbackHandler(),
      chainId,
      accounts,
      contractNetworks,
      provider
    }
  })

  describe('init', async () => {
    it('should fail if the SafeProxyFactory contract provided is not deployed', async () => {
      const { chainId, provider, accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const contractNetworksWithoutSafeProxyFactoryContract = {
        [chainId.toString()]: {
          ...contractNetworks[chainId.toString()],
          safeProxyFactoryAddress: ZERO_ADDRESS,
          safeProxyFactoryAbi: (await getFactory()).abi
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks: contractNetworksWithoutSafeProxyFactoryContract,
        predictedSafe
      })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('SafeProxyFactory contract is not deployed on the current network')
    })
  })

  describe('predictSafeAddress', async () => {
    it('should fail if there are no owners', async () => {
      const { contractNetworks, provider } = await setupTests()
      const owners: string[] = []
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '1'
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce
        }
      }

      const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

      await chai.expect(safeSDK.deploy()).rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const invalidThreshold = 0
      const saltNonce = '1'
      const safeAccountConfig: SafeAccountConfig = { owners, threshold: invalidThreshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce
        }
      }

      const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the number of owners', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const invalidThreshold = 3
      const safeAccountConfig: SafeAccountConfig = { owners, threshold: invalidThreshold }
      const saltNonce = '1'
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce
        }
      }

      const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const invalidSaltNonce = '-1'
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce: invalidSaltNonce
        }
      }

      const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    it('should predict a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '12345'
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce
        }
      }

      const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

      const counterfactualSafeAddress = await safeSDK.getAddress()

      const safeSDKDeployed = await safeSDK.deploy()

      chai.expect(counterfactualSafeAddress).to.be.eq(await safeSDKDeployed.getAddress())
      chai.expect(threshold).to.be.eq(await safeSDKDeployed.getThreshold())
      const deployedSafeOwners = await safeSDKDeployed.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should predict a new Safe with the default CompatibilityFallbackHandler',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }
        const saltNonce = '12345'
        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed,
            saltNonce
          }
        }

        const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

        const counterfactualSafeAddress = await safeSDK.getAddress()

        const safeSDKDeployed = await safeSDK.deploy()

        chai.expect(counterfactualSafeAddress).to.be.eq(await safeSDKDeployed.getAddress())
        const compatibilityFallbackHandler = await (
          await getCompatibilityFallbackHandler()
        ).contract.getAddress()
        chai
          .expect(compatibilityFallbackHandler)
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      }
    )

    itif(safeVersionDeployed > '1.3.0')(
      'should predict a new Safe with a custom fallback handler',
      async () => {
        const { accounts, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold,
          fallbackHandler: await defaultCallbackHandler.getAddress()
        }
        const saltNonce = '12345'
        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed,
            saltNonce
          }
        }

        const safeSDK = await Safe.init({ provider, contractNetworks, predictedSafe })

        const counterfactualSafeAddress = await safeSDK.getAddress()

        const safeSDKDeployed = await safeSDK.deploy()

        chai.expect(counterfactualSafeAddress).to.be.eq(await safeSDKDeployed.getAddress())
        chai
          .expect(await defaultCallbackHandler.getAddress())
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())
      }
    )
  })

  describe('deploySafe', async () => {
    it('should fail if the Safe is deployed', async () => {
      const { contractNetworks, provider, accounts } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      chai.expect(await safeSDK.isSafeDeployed()).to.be.false

      const safeSDKDeployed = await safeSDK.deploy()

      await chai.expect(safeSDK.deploy()).rejectedWith('Safe already deployed')
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
    })

    it('should fail if there are no owners', async () => {
      const { contractNetworks, provider } = await setupTests()
      const owners: string[] = []
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      await chai.expect(safeSDK.deploy()).rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 0
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the number of owners', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 3
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const invalidSaltNonce = '-1'

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce: invalidSaltNonce
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      await chai
        .expect(safeSDK.deploy())
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should deploy a new Safe with custom fallback handler',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const customFallbackHandler = accounts[3].address
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold,
          fallbackHandler: customFallbackHandler
        }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed
          }
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const safeSDKDeployed = await safeSDK.deploy()

        const deployedSafeOwners = await safeSDKDeployed.getOwners()
        const deployedSafeThreshold = await safeSDKDeployed.getThreshold()
        const fallbackHandler = await safeSDKDeployed.getFallbackHandler()

        chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
        chai.expect(deployedSafeThreshold).to.be.eq(threshold)
        chai.expect(customFallbackHandler).to.be.eq(fallbackHandler)
        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
      }
    )

    itif(safeVersionDeployed > '1.0.0')(
      'should deploy a new Safe with the default CompatibilityFallbackHandler',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold
        }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed
          }
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const safeSDKDeployed = await safeSDK.deploy()

        const defaultCompatibilityFallbackHandler = await (
          await getCompatibilityFallbackHandler()
        ).contract.getAddress()

        chai
          .expect(defaultCompatibilityFallbackHandler)
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())

        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
      }
    )

    it('should deploy a new Safe without saltNonce', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      chai.expect(await safeSDK.isSafeDeployed()).to.be.false

      const safeSDKDeployed = await safeSDK.deploy()

      const deployedSafeOwners = await safeSDKDeployed.getOwners()
      const deployedSafeThreshold = await safeSDKDeployed.getThreshold()

      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    it('should deploy a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const saltNonce = '1'

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed,
          saltNonce
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      chai.expect(await safeSDK.isSafeDeployed()).to.be.false

      const safeSDKDeployed = await safeSDK.deploy()

      const deployedSafeOwners = await safeSDKDeployed.getOwners()
      const deployedSafeThreshold = await safeSDKDeployed.getThreshold()

      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    itif(safeVersionDeployed === DEFAULT_SAFE_VERSION)(
      'should deploy last Safe version by default',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: DEFAULT_SAFE_VERSION
          }
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const safeSDKDeployed = await safeSDK.deploy()

        const safeInstanceVersion = await safeSDKDeployed.getContractVersion()

        chai.expect(safeInstanceVersion).to.be.eq(DEFAULT_SAFE_VERSION)
        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
      }
    )

    it('should deploy a specific Safe version', async () => {
      const { accounts, contractNetworks, provider } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 2
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const safeSDK = await Safe.init({
        provider,
        contractNetworks,
        predictedSafe
      })

      chai.expect(await safeSDK.isSafeDeployed()).to.be.false

      const safeSDKDeployed = await safeSDK.deploy()

      const safeInstanceVersion = await safeSDKDeployed.getContractVersion()

      chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should deploy the Safe Account and execute a transaction',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 1
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed
          }
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        const transaction = {
          to: account2.address,
          value: '0',
          data: '0x'
        }

        const safeTransaction = await safeSDK.createTransaction({ transactions: [transaction] })

        const signedSafeTransaction = await safeSDK.signTransaction(safeTransaction)

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const safeSDKDeployed = await safeSDK.deploy(signedSafeTransaction)

        const safeInstanceVersion = await safeSDKDeployed.getContractVersion()

        chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(1)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should deploy the Safe Account and execute a batch of transactions',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 1
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig,
          safeDeploymentConfig: {
            safeVersion: safeVersionDeployed
          }
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        const firstTransaction = {
          to: account1.address,
          value: '0',
          data: '0x'
        }

        const secondTransaction = {
          to: account2.address,
          value: '0',
          data: '0x'
        }

        // batch to execute after the deployment
        const transactions = [firstTransaction, secondTransaction]

        const safeTransaction = await safeSDK.createTransaction({ transactions })

        const signedSafeTransaction = await safeSDK.signTransaction(safeTransaction)

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const safeSDKDeployed = await safeSDK.deploy(signedSafeTransaction)

        const safeInstanceVersion = await safeSDKDeployed.getContractVersion()

        chai.expect(safeInstanceVersion).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(1)
      }
    )
  })
})
