import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { keccak256, toHex } from 'viem'
import {
  safeVersionDeployed,
  setupTests,
  itif,
  getSafeWithOwners,
  getFactory
} from '@safe-global/testing-kit'
import Safe, {
  PREDETERMINED_SALT_NONCE,
  SafeProvider,
  encodeSetupCallData,
  getSafeContract
} from '@safe-global/protocol-kit/index'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

describe('createSafeDeploymentTransaction', () => {
  const provider = getEip1193Provider()

  itif(safeVersionDeployed == '1.4.1')('should return a Safe deployment transactions', async () => {
    const { contractNetworks, predictedSafe } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = (await getFactory()).contract.address

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b9000000000000000000000000880ed85cacd4d9209452170fc4f16d4fddf00c660000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000060457d01a15434df4c05b29aefbb2d94dc8ddbab000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.3.0')('should return a Safe deployment transactions', async () => {
    const { contractNetworks, predictedSafe } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = (await getFactory()).contract.address

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b900000000000000000000000012d800ba6577c89ea9bd6728ea6ca40bab7114940000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000008bec390d0b38e898788fa2aa4e50c263c48f84e3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.2.0')('should return a Safe deployment transactions', async () => {
    const { contractNetworks, predictedSafe } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = (await getFactory()).contract.address

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b90000000000000000000000001634c531e43c1fd383741a8da6215e4ae08233660000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000008bec390d0b38e898788fa2aa4e50c263c48f84e3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.1.1')('should return a Safe deployment transactions', async () => {
    const { contractNetworks, predictedSafe } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = (await getFactory()).contract.address

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b9000000000000000000000000d7b2104dc288b0abef09086bac0b6ec43dd435340000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000008bec390d0b38e898788fa2aa4e50c263c48f84e3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  itif(safeVersionDeployed == '1.0.0')('should return a Safe deployment transactions', async () => {
    const { contractNetworks, predictedSafe } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })

    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const safeFactoryAddress = (await getFactory()).contract.address

    chai.expect(deploymentTransaction).to.be.deep.equal({
      to: safeFactoryAddress,
      value: '0',
      // safe deployment data (createProxyWithNonce)
      data: '0x1688f0b900000000000000000000000036f1a004f26597201a297e4935e84ea4ccd506580000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000144a97ab18a00000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    })
  })

  it('should contain the initializer setup call in the deployment data to sets the threshold & owners of the deployed Safe', async () => {
    const { contractNetworks, predictedSafe, chainId } = await setupTests()

    const safeSdk = await Safe.init({
      provider,
      predictedSafe,
      contractNetworks
    })
    const safeProvider = safeSdk.getSafeProvider()
    const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

    const customContracts = contractNetworks[chainId.toString()]
    const safeContract = await getSafeContract({
      safeProvider,
      safeVersion: safeVersionDeployed,
      customContracts
    })

    // this is the call to the setup method that sets the threshold & owners of the new Safe
    const initializer = await encodeSetupCallData({
      safeProvider,
      safeContract,
      safeAccountConfig: predictedSafe.safeAccountConfig,
      customContracts: contractNetworks[chainId.toString()]
    })

    // should contain the initializer setup call in the deployment data
    chai.expect(deploymentTransaction.data).to.contains(initializer.replace('0x', ''))
  })

  describe('salt nonce', () => {
    it('should include the predetermined salt nonce in the Safe deployment data', async () => {
      const { contractNetworks, predictedSafe, chainId } = await setupTests()

      const safeProvider = new SafeProvider({ provider })
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })

      const predeterminedSaltNonceEncoded = safeProvider.encodeParameters('uint256', [
        keccak256(toHex(PREDETERMINED_SALT_NONCE + chainId))
      ])

      const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

      // predetermined salt nonce included in the deployment data
      chai
        .expect(deploymentTransaction.data)
        .to.contains(predeterminedSaltNonceEncoded.replace('0x', ''))
    })

    it('should include the salt nonce included in the safeDeploymentConfig in the Safe deployment data', async () => {
      const { contractNetworks, predictedSafe } = await setupTests()

      const customSaltNonce = '123456789'

      const safeSdk = await Safe.init({
        provider,
        predictedSafe: {
          ...predictedSafe,
          safeDeploymentConfig: {
            ...predictedSafe.safeDeploymentConfig,
            saltNonce: customSaltNonce
          }
        },
        contractNetworks
      })

      const saltNonceEncoded = safeSdk
        .getSafeProvider()
        .encodeParameters('uint256', [customSaltNonce])

      const deploymentTransaction = await safeSdk.createSafeDeploymentTransaction()

      // custom salt nonce included in the deployment data
      chai.expect(deploymentTransaction.data).to.contains(saltNonceEncoded.replace('0x', ''))
    })
  })

  it('should throw an error if predicted Safe is not present', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const safeAddress = safe.address

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    await chai
      .expect(safeSdk.createSafeDeploymentTransaction())
      .to.be.rejectedWith('Predict Safe should be present')
  })
})
