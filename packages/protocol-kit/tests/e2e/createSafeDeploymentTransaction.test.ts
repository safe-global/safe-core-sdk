import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { keccak_256 } from '@noble/hashes/sha3'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PREDETERMINED_SALT_NONCE,
  PredictedSafeProps,
  encodeSetupCallData
} from '@safe-global/protocol-kit/index'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getSafeWithOwners, getFactory } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { itif } from './utils/helpers'

chai.use(chaiAsPromised)

describe('createSafeDeploymentTransaction', () => {
  const setupTests = deployments.createFixture(async ({ deployments, getChainId }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId = BigInt(await getChainId())
    const contractNetworks = await getContractNetworks(chainId)

    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners: [accounts[0].address],
        threshold: 1
      },
      safeDeploymentConfig: {
        safeVersion: safeVersionDeployed
      }
    }

    return {
      accounts,
      contractNetworks,
      predictedSafe,
      chainId
    }
  })

  itif(safeVersionDeployed == '1.4.1')('should return a Safe deployment transactions', async () => {
    const { accounts, contractNetworks, predictedSafe } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = await (await getFactory()).contract.getAddress()

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b900000000000000000000000031233647996a4e0d623c9ba42ce8538c2531e22b0000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000003f20fb66d809929e59d9ab1e725d307d696b5593000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.3.0')('should return a Safe deployment transactions', async () => {
    const { accounts, contractNetworks, predictedSafe } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = await (await getFactory()).contract.getAddress()

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b90000000000000000000000008e6332da7ccd5430bfb27df39fbf386b463c31a50000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000085692cd6f0b50e6d48b98153cba504a09564e776000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.2.0')('should return a Safe deployment transactions', async () => {
    const { accounts, contractNetworks, predictedSafe } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = await (await getFactory()).contract.getAddress()

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b90000000000000000000000008c4e89ea8f69e5f4943734b5a2d7c364f01bd3dc0000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000085692cd6f0b50e6d48b98153cba504a09564e776000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.1.1')('should return a Safe deployment transactions', async () => {
    const { accounts, contractNetworks, predictedSafe } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = await (await getFactory()).contract.getAddress()

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b9000000000000000000000000d7b2104dc288b0abef09086bac0b6ec43dd435340000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000085692cd6f0b50e6d48b98153cba504a09564e776000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.0.0')('should return a Safe deployment transactions', async () => {
    const { accounts, contractNetworks, predictedSafe } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = await (await getFactory()).contract.getAddress()

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b900000000000000000000000036f1a004f26597201a297e4935e84ea4ccd506580000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000144a97ab18a00000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  it('should contain the initializer setup call in the deployment data to sets the threshold & owners of the deployed Safe', async () => {
    const { accounts, contractNetworks, predictedSafe, chainId } = await setupTests()
    const [account1] = accounts

    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const customContract = contractNetworks[chainId.toString()]
    const safeContract = await ethAdapter.getSafeContract({
      safeVersion: safeVersionDeployed,
      customContractAddress: customContract?.safeSingletonAddress,
      customContractAbi: customContract?.safeSingletonAbi
    })

    // this is the call to the setup method that sets the threshold & owners of the new Safe
    const initializer = await encodeSetupCallData({
      ethAdapter,
      safeContract,
      safeAccountConfig: predictedSafe.safeAccountConfig,
      customContracts: contractNetworks[chainId.toString()]
    })

    // should contain the initializer setup call in the deployment data
    chai.expect(deploymentTransaction.data).to.contains(initializer.replace('0x', ''))
  })

  describe('salt nonce', () => {
    it('should include the predetermined salt nonce in the Safe deployment data', async () => {
      const { accounts, contractNetworks, predictedSafe, chainId } = await setupTests()
      const [account1] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })

      const predeterminedSaltNonceEncoded = ethAdapter.encodeParameters(
        ['uint256'],
        [`0x${Buffer.from(keccak_256(PREDETERMINED_SALT_NONCE + chainId)).toString('hex')}`]
      )

      const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

      // predetermined salt nonce included in the deployment data
      chai
        .expect(deploymentTransaction.data)
        .to.contains(predeterminedSaltNonceEncoded.replace('0x', ''))
    })

    it('should include the custom salt nonce in the Safe deployment data', async () => {
      const { accounts, contractNetworks, predictedSafe } = await setupTests()
      const [account1] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })

      const customSaltNonce = '123456789'

      const customSaltNonceEncoded = ethAdapter.encodeParameters(['uint256'], [customSaltNonce])

      const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction(customSaltNonce)

      // custom salt nonce included in the deployment data
      chai.expect(deploymentTransaction.data).to.contains(customSaltNonceEncoded.replace('0x', ''))
    })

    it('should include the salt nonce included in the safeDeploymentConfig in the Safe deployment data', async () => {
      const { accounts, contractNetworks, predictedSafe } = await setupTests()
      const [account1] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const customSaltNonce = '123456789'

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe: {
          ...predictedSafe,
          safeDeploymentConfig: {
            ...predictedSafe.safeDeploymentConfig,
            saltNonce: customSaltNonce
          }
        },
        contractNetworks
      })

      const saltNonceEncoded = ethAdapter.encodeParameters(['uint256'], [customSaltNonce])

      const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction(customSaltNonce)

      // custom salt nonce included in the deployment data
      chai.expect(deploymentTransaction.data).to.contains(saltNonceEncoded.replace('0x', ''))
    })
  })

  it('should throw an error if predicted Safe is not present', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter = await getEthAdapter(account1.signer)
    const safeAddress = await safe.getAddress()

    const safeSdk = await Safe.create({
      ethAdapter,
      safeAddress,
      contractNetworks
    })

    await chai
      .expect(safeSdk.createSafeDeploymentTransaction())
      .to.be.rejectedWith('Predict Safe should be present')
  })
})
