import chai from 'chai'
import { deployments, waffle } from 'hardhat'

import { getAccounts } from './utils/setupTestNetwork'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getDefaultCallbackHandler } from './utils/setupContracts'
import { getEthAdapter, getNetworkProvider } from './utils/setupEthAdapter'
import {
  PREDETERMINED_SALT_NONCE,
  predictSafeAddress
} from '@safe-global/protocol-kit/contracts/utils'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import {
  SafeDeploymentConfig,
  SafeAccountConfig,
  ContractNetworksConfig
} from '@safe-global/protocol-kit/types'
import Safe, { SafeFactory, DeploySafeProps } from '@safe-global/protocol-kit/index'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import { itif } from './utils/helpers'

// test util funcion to deploy a safe (needed to check the expected Safe Address)
async function deploySafe(
  deploySafeProps: DeploySafeProps,
  ethAdapter: EthAdapter,
  contractNetworks: ContractNetworksConfig
): Promise<Safe> {
  const safeFactory = await SafeFactory.create({
    ethAdapter,
    safeVersion: safeVersionDeployed,
    contractNetworks
  })

  return await safeFactory.deploySafe(deploySafeProps)
}

describe('Contract utils', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      defaultCallbackHandler: await getDefaultCallbackHandler(),
      chainId,
      accounts,
      contractNetworks
    }
  })

  describe('predictSafeAddress', () => {
    it('returns the predicted address of a 1/1 Safe', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // 1/1 Safe
      const [owner1] = accounts
      const owners = [owner1.address]
      const threshold = 1
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const deployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: safeDeploymentConfig.saltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      const isSafeDeployed = await deployedSafe.isSafeDeployed()
      const expectedSafeAddress = await deployedSafe.getAddress()

      chai.expect(isSafeDeployed).to.be.true
      chai.expect(predictedSafeAddress).to.be.equal(expectedSafeAddress)
    })

    it('returns the predicted address of a 1/2 Safe', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // 1/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const threshold = 1
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const deployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: safeDeploymentConfig.saltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      const isSafeDeployed = await deployedSafe.isSafeDeployed()
      const expectedSafeAddress = await deployedSafe.getAddress()

      chai.expect(isSafeDeployed).to.be.true
      chai.expect(predictedSafeAddress).to.be.equal(expectedSafeAddress)
    })

    it('returns the predicted address of a 2/2 Safe', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // 2/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const threshold = 2
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const deployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: safeDeploymentConfig.saltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      const isSafeDeployed = await deployedSafe.isSafeDeployed()
      const expectedSafeAddress = await deployedSafe.getAddress()

      chai.expect(isSafeDeployed).to.be.true
      chai.expect(predictedSafeAddress).to.be.equal(expectedSafeAddress)
    })

    it('should fail if the provided threshold is invalid (greater than owners length)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // invalid threshold 3/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const invalidThreshold = 3
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold: invalidThreshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictSafeAddressWithInvalidThreshold = {
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      }

      await chai
        .expect(predictSafeAddress(predictSafeAddressWithInvalidThreshold))
        .to.be.rejectedWith('Threshold must be lower than or equal to owners length')
    })

    it('should fail if the provided threshold is invalid (zero value)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // invalid threshold 0/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const invalidThreshold = 0
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold: invalidThreshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictSafeAddressWithInvalidThreshold = {
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      }

      await chai
        .expect(predictSafeAddress(predictSafeAddressWithInvalidThreshold))
        .to.be.rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if the provided threshold is invalid (negative value)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // invalid threshold -2/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const invalidThreshold = -2
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold: invalidThreshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictSafeAddressWithInvalidThreshold = {
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      }

      await chai
        .expect(predictSafeAddress(predictSafeAddressWithInvalidThreshold))
        .to.be.rejectedWith('Threshold must be greater than or equal to 1')
    })

    it('should fail if no owners are present (empty array)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // invalid owners 1/0 Safe
      const invalidOwners: string[] = []
      const threshold = 1
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(accounts[0].signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners: invalidOwners,
        threshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      const predictSafeAddressWithInvalidThreshold = {
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      }

      await chai
        .expect(predictSafeAddress(predictSafeAddressWithInvalidThreshold))
        .to.be.rejectedWith('Owner list must have at least one owner')
    })

    it('returns different addresses with different saltNonce value but same Safe config (threshold & owners)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // 1/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const threshold = 1
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold
      }

      const firstSaltNonce = '1'
      const secondSaltNonce = '2'
      const thirdSaltNonce = '3'

      const predictedSafeAddress1 = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion,
          saltNonce: firstSaltNonce
        },
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const firstDeployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: firstSaltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      chai.expect(await firstDeployedSafe.isSafeDeployed()).to.be.true
      // expected safe address for saltNonce = 1
      chai.expect(predictedSafeAddress1).to.be.equal(await firstDeployedSafe.getAddress())

      const predictedSafeAddress2 = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion,
          saltNonce: secondSaltNonce
        },
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const secondDeployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: secondSaltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      chai.expect(await secondDeployedSafe.isSafeDeployed()).to.be.true
      // expected safe address for saltNonce = 2
      chai.expect(predictedSafeAddress2).to.be.equal(await secondDeployedSafe.getAddress())

      const predictedSafeAddress3 = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion,
          saltNonce: thirdSaltNonce
        },
        customContracts
      })

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const thirdDeployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: thirdSaltNonce },
        ethAdapter,
        contractNetworks
      )

      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      chai.expect(await thirdDeployedSafe.isSafeDeployed()).to.be.true
      // expected safe address for saltNonce = 3
      chai.expect(predictedSafeAddress3).to.be.equal(await thirdDeployedSafe.getAddress())
    })

    it('returns the same predicted address for multiple calls to predictedSafeAddress with the same config (owners, threshold & saltNonce)', async () => {
      const { accounts, contractNetworks, chainId } = await setupTests()

      // 2/2 Safe
      const [owner1, owner2] = accounts
      const owners = [owner1.address, owner2.address]
      const threshold = 2
      const safeVersion = safeVersionDeployed
      const ethAdapter = await getEthAdapter(owner1.signer)
      const customContracts = contractNetworks[chainId]

      const safeAccountConfig: SafeAccountConfig = {
        owners,
        threshold
      }

      const safeDeploymentConfig: SafeDeploymentConfig = {
        safeVersion,
        saltNonce: PREDETERMINED_SALT_NONCE
      }

      // we deploy the Safe with the given configuration and the deployed Safe address should be equal to the predicted one
      const deployedSafe = await deploySafe(
        { safeAccountConfig, saltNonce: safeDeploymentConfig.saltNonce },
        ethAdapter,
        contractNetworks
      )
      // We ensure the Safe is deployed, as getAddress() function is able to return an address for a predictedSafe
      const isSafeDeployed = await deployedSafe.isSafeDeployed()
      const expectedSafeAddress = await deployedSafe.getAddress()

      const firstPredictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      const secondPredictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      const thirdPredictedSafeAddress = await predictSafeAddress({
        ethAdapter,
        safeAccountConfig,
        safeDeploymentConfig,
        customContracts
      })

      chai.expect(isSafeDeployed).to.be.true
      // returns the same predicted address each call
      chai.expect(firstPredictedSafeAddress).to.be.equal(expectedSafeAddress)
      chai.expect(secondPredictedSafeAddress).to.be.equal(expectedSafeAddress)
      chai.expect(thirdPredictedSafeAddress).to.be.equal(expectedSafeAddress)
    })

    itif(safeVersionDeployed > '1.0.0')(
      'safeDeploymentConfig is an optional parameter',
      async () => {
        const { accounts, contractNetworks, chainId } = await setupTests()

        // 1/1 Safe
        const [owner1] = accounts
        const owners = [owner1.address]
        const threshold = 1
        const ethAdapter = await getEthAdapter(owner1.signer)
        const customContracts = contractNetworks[chainId]

        const safeAccountConfig: SafeAccountConfig = {
          owners,
          threshold
        }

        const predictedSafeAddress = await predictSafeAddress({
          ethAdapter,
          safeAccountConfig,
          customContracts
        })

        // we deploy the Safe by providing only the safeAccountConfig (owners & threshold)
        const deployedSafe = await deploySafe({ safeAccountConfig }, ethAdapter, contractNetworks)

        // We ensure the Safe is deployed
        const isSafeDeployed = await deployedSafe.isSafeDeployed()
        chai.expect(isSafeDeployed).to.be.true

        // The deployed Safe address should be equal to the predicted address
        const expectedSafeAddress = await deployedSafe.getAddress()
        chai.expect(predictedSafeAddress).to.be.equal(expectedSafeAddress)
      }
    )
    itif(safeVersionDeployed === '1.3.0')(
      'returns the predicted address for Safes deployed on zkSync Era',
      async () => {
        const { contractNetworks } = await setupTests()

        const safeVersion = safeVersionDeployed
        // Create EthAdapter instance
        const ethAdapter = await getEthAdapter(getNetworkProvider('zksync'))
        const chainId = await ethAdapter.getChainId()
        const customContracts = contractNetworks[chainId]

        // We check real deployments from zksync return the expected address.

        // 1/1 Safe
        const safeAccountConfig1: SafeAccountConfig = {
          owners: ['0xc6b82bA149CFA113f8f48d5E3b1F78e933e16DfD'],
          threshold: 1
        }
        const safeDeploymentConfig1: SafeDeploymentConfig = {
          safeVersion,
          saltNonce: '1691490995332'
        }
        const expectedSafeAddress1 = '0x4e19dA81a54eFbaBeb9AD50646f7643076475D65'

        const firstPredictedSafeAddress = await predictSafeAddress({
          ethAdapter,
          safeAccountConfig: safeAccountConfig1,
          safeDeploymentConfig: safeDeploymentConfig1,
          customContracts
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
          safeVersion,
          saltNonce: '1690771277826'
        }
        const expectedSafeAddress2 = '0x60c7F13dE7C8Fb88b3845e58859658bdc44243F8'

        const secondPredictedSafeAddress = await predictSafeAddress({
          ethAdapter,
          safeAccountConfig: safeAccountConfig2,
          safeDeploymentConfig: safeDeploymentConfig2,
          customContracts
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
          safeVersion,
          saltNonce: '1690944491662'
        }
        const expectedSafeAddress3 = '0xD971FAA20db3ad4d51D453047ca03Ce4ec164CE2'

        const thirdPredictedSafeAddress = await predictSafeAddress({
          ethAdapter,
          safeAccountConfig: safeAccountConfig3,
          safeDeploymentConfig: safeDeploymentConfig3,
          customContracts
        })

        // returns the same predicted address each call
        chai.expect(firstPredictedSafeAddress).to.be.equal(expectedSafeAddress1)
        chai.expect(secondPredictedSafeAddress).to.be.equal(expectedSafeAddress2)
        chai.expect(thirdPredictedSafeAddress).to.be.equal(expectedSafeAddress3)
      }
    )
  })
})
