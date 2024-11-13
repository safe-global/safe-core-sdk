import { DEFAULT_SAFE_VERSION } from '@safe-global/protocol-kit/contracts/config'
import {
  getCompatibilityFallbackHandler,
  getDefaultCallbackHandler,
  getFactory,
  itif,
  safeVersionDeployed,
  setupTests,
  waitTransactionReceipt
} from '@safe-global/testing-kit'
import Safe, {
  getSafeAddressFromDeploymentTx,
  PredictedSafeProps,
  SafeAccountConfig
} from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
// import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe Deployment', () => {
  const provider = getEip1193Provider()

  describe('init', async () => {
    it('should fail if the SafeProxyFactory contract provided is not deployed', async () => {
      const { chainId, accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('SafeProxyFactory contract is not deployed on the current network')
    })
  })

  describe('predictSafeAddress', async () => {
    it('should fail if there are no owners', async () => {
      const { contractNetworks } = await setupTests()
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

      await chai
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the number of owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    itif(safeVersionDeployed < '1.3.0')(
      'should fail if the safe Version is lower than 1.3.0',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
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

        await chai
          .expect(safeSDK.getAddress())
          .rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should predict a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
      const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

      const signer = account1.signer
      await signer.sendTransaction(deploymentTransaction)

      chai.expect(counterfactualSafeAddress).to.be.eq(await safeSDK.getAddress())
      chai.expect(threshold).to.be.eq(await safeSDK.getThreshold())
      const deployedSafeOwners = await safeSDK.getOwners()
      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(safeSDK.getContractVersion()).to.be.eq(safeVersionDeployed)
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should predict a new Safe with the default CompatibilityFallbackHandler',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
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

        const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

        const signer = accounts[0].signer

        const txHash = await signer.sendTransaction(deploymentTransaction)

        const txReceipt = await waitTransactionReceipt(txHash)

        const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

        const safeSDKDeployed = await Safe.init({
          provider,
          contractNetworks,
          safeAddress
        })

        const compatibilityFallbackHandler = (await getCompatibilityFallbackHandler()).contract
          .address
        chai
          .expect(compatibilityFallbackHandler)
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())
        chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      }
    )

    itif(safeVersionDeployed > '1.3.0')(
      'should predict a new Safe with a custom fallback handler',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const defaultCallbackHandler = await getDefaultCallbackHandler()
        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold,
          fallbackHandler: defaultCallbackHandler.address
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

        const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

        const signer = accounts[0].signer

        const txHash = await signer.sendTransaction(deploymentTransaction)

        const txReceipt = await waitTransactionReceipt(txHash)

        const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

        const safeSDKDeployed = await Safe.init({
          provider,
          contractNetworks,
          safeAddress
        })

        chai
          .expect(defaultCallbackHandler.address)
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())
      }
    )
  })

  describe('deploySafe', async () => {
    itif(safeVersionDeployed >= '1.3.0')('should fail if the Safe is deployed', async () => {
      const { contractNetworks, accounts } = await setupTests()
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

      const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

      const signer = accounts[0].signer
      await signer.sendTransaction(deploymentTransaction)

      await chai
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Safe already deployed')

      chai.expect(await safeSDK.isSafeDeployed()).to.be.true
    })

    it('should fail if there are no owners', async () => {
      const { contractNetworks } = await setupTests()
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

      await chai
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Owner list must have at least one owner')
    })

    it('should fail if the threshold is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the threshold is higher than the number of owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the saltNonce is lower than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
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
        .expect(safeSDK.createSafeDeploymentTransaction())
        .rejectedWith('saltNonce must be greater than or equal to 0')
    })

    itif(safeVersionDeployed > '1.0.0')(
      'should deploy a new Safe with custom fallback handler',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
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

        if (safeVersionDeployed >= '1.3.0') {
          chai.expect(await safeSDK.isSafeDeployed()).to.be.false
        }

        const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

        const signer = accounts[0].signer
        const txHash = await signer.sendTransaction(deploymentTransaction)

        const txReceipt = await waitTransactionReceipt(txHash)

        const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

        const safeSDKDeployed = await Safe.init({
          provider,
          contractNetworks,
          safeAddress
        })

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
        const { accounts, contractNetworks } = await setupTests()
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

        if (safeVersionDeployed >= '1.3.0') {
          chai.expect(await safeSDK.isSafeDeployed()).to.be.false
        }

        const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

        const signer = accounts[0].signer
        const txHash = await signer.sendTransaction(deploymentTransaction)

        const txReceipt = await waitTransactionReceipt(txHash)

        const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

        const safeSDKDeployed = await Safe.init({
          provider,
          contractNetworks,
          safeAddress
        })

        const defaultCompatibilityFallbackHandler = (await getCompatibilityFallbackHandler())
          .contract.address

        chai
          .expect(defaultCompatibilityFallbackHandler)
          .to.be.eq(await safeSDKDeployed.getFallbackHandler())

        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
      }
    )

    it('should deploy a new Safe without saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
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

      if (safeVersionDeployed >= '1.3.0') {
        chai.expect(await safeSDK.isSafeDeployed()).to.be.false
      }

      const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

      const signer = accounts[0].signer
      const txHash = await signer.sendTransaction(deploymentTransaction)

      const txReceipt = await waitTransactionReceipt(txHash)

      const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

      const safeSDKDeployed = await Safe.init({
        provider,
        contractNetworks,
        safeAddress
      })

      const deployedSafeOwners = await safeSDKDeployed.getOwners()
      const deployedSafeThreshold = await safeSDKDeployed.getThreshold()

      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(await safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    it('should deploy a new Safe with saltNonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
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

      if (safeVersionDeployed >= '1.3.0') {
        chai.expect(await safeSDK.isSafeDeployed()).to.be.false
      }

      const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

      const signer = accounts[0].signer
      const txHash = await signer.sendTransaction(deploymentTransaction)

      const txReceipt = await waitTransactionReceipt(txHash)

      const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

      const safeSDKDeployed = await Safe.init({
        provider,
        contractNetworks,
        safeAddress
      })

      const deployedSafeOwners = await safeSDKDeployed.getOwners()
      const deployedSafeThreshold = await safeSDKDeployed.getThreshold()

      chai.expect(deployedSafeOwners.toString()).to.be.eq(owners.toString())
      chai.expect(deployedSafeThreshold).to.be.eq(threshold)
      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    itif(safeVersionDeployed == '1.3.0')(
      'should deploy the v1.3.0 Safe version by default',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1, account2] = accounts
        const owners = [account1.address, account2.address]
        const threshold = 2
        const safeAccountConfig: SafeAccountConfig = { owners, threshold }

        const predictedSafe: PredictedSafeProps = {
          safeAccountConfig
        }

        const safeSDK = await Safe.init({
          provider,
          contractNetworks,
          predictedSafe
        })

        chai.expect(await safeSDK.isSafeDeployed()).to.be.false

        const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

        const signer = accounts[0].signer
        const txHash = await signer.sendTransaction(deploymentTransaction)

        const txReceipt = await waitTransactionReceipt(txHash)

        const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, DEFAULT_SAFE_VERSION)

        const safeSDKDeployed = await Safe.init({
          provider,
          contractNetworks,
          safeAddress
        })

        chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
        chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(DEFAULT_SAFE_VERSION)
        chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
      }
    )

    it('should deploy a specific Safe version', async () => {
      const { accounts, contractNetworks } = await setupTests()
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

      if (safeVersionDeployed >= '1.3.0') {
        chai.expect(await safeSDK.isSafeDeployed()).to.be.false
      }

      const deploymentTransaction = await safeSDK.createSafeDeploymentTransaction()

      const signer = accounts[0].signer
      const txHash = await signer.sendTransaction(deploymentTransaction)

      const txReceipt = await waitTransactionReceipt(txHash)

      const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

      const safeSDKDeployed = await Safe.init({
        provider,
        contractNetworks,
        safeAddress
      })

      chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
      chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
      chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(0)
    })

    describe('counterfactual deployment via wrapSafeTransactionIntoDeploymentBatch', () => {
      itif(safeVersionDeployed >= '1.3.0')(
        'should deploy the Safe Account and execute one transaction',
        async () => {
          const { accounts, contractNetworks } = await setupTests()
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

          const deploymentTransaction =
            await safeSDK.wrapSafeTransactionIntoDeploymentBatch(signedSafeTransaction)

          chai.expect(await safeSDK.isSafeDeployed()).to.be.false

          const signer = accounts[0].signer
          const txHash = await signer.sendTransaction(deploymentTransaction)

          const txReceipt = await waitTransactionReceipt(txHash)

          const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

          const safeSDKDeployed = await Safe.init({
            provider,
            contractNetworks,
            safeAddress
          })

          chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
          chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
          chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(1)
        }
      )
      itif(safeVersionDeployed >= '1.3.0')(
        'should deploy the Safe Account and execute a batch of transactions',
        async () => {
          const { accounts, contractNetworks } = await setupTests()
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

          const deploymentTransaction =
            await safeSDK.wrapSafeTransactionIntoDeploymentBatch(signedSafeTransaction)

          const signer = accounts[0].signer
          const txHash = await signer.sendTransaction(deploymentTransaction)

          const txReceipt = await waitTransactionReceipt(txHash)

          const safeAddress = getSafeAddressFromDeploymentTx(txReceipt, safeVersionDeployed)

          const safeSDKDeployed = await Safe.init({
            provider,
            contractNetworks,
            safeAddress
          })

          chai.expect(await safeSDKDeployed.isSafeDeployed()).to.be.true
          chai.expect(safeSDKDeployed.getContractVersion()).to.be.eq(safeVersionDeployed)
          chai.expect(await safeSDKDeployed.getNonce()).to.be.eq(1)
        }
      )

      itif(safeVersionDeployed < '1.3.0')(
        'Account Abstraction functionality is not available for Safes with version lower than v1.3.0',
        async () => {
          const { accounts, contractNetworks } = await setupTests()
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

          await chai
            .expect(safeSDK.createTransaction({ transactions }))
            .rejectedWith(
              'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
            )
        }
      )
    })
  })
})
