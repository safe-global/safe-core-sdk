import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { getContractNetworks } from './utils/setupContractNetworks'
import { itif } from './utils/helpers'
import { getSafeWithOwners, getMultiSendCallOnly } from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

const AMOUNT_TO_TRANSFER = '500000000000000000' // 0.5 ETH

describe('wrapSafeTransactionIntoDeploymentBatch', () => {
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
    const provider = getEip1193Provider()

    return {
      accounts,
      contractNetworks,
      predictedSafe,
      chainId,
      provider
    }
  })

  it('should throw an error if the Safe is already deployed', async () => {
    const { accounts, contractNetworks, provider } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const safeAddress = await safe.getAddress()

    const safeSdk = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })

    const safeTransactionData = {
      to: account2.address,
      value: AMOUNT_TO_TRANSFER,
      data: '0x'
    }

    const safeTransaction = await safeSdk.createTransaction({
      transactions: [safeTransactionData]
    })

    await chai
      .expect(safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction))
      .to.be.rejectedWith('Safe already deployed')
  })

  itif(safeVersionDeployed == '1.4.1')(
    'should return a batch transaction with the Safe deployment Transaction and the Safe Transaction',
    async () => {
      const { accounts, contractNetworks, predictedSafe, provider } = await setupTests()
      const [, account2] = accounts

      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })

      const safeTransactionData = {
        to: account2.address,
        value: AMOUNT_TO_TRANSFER,
        data: '0x'
      }

      const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData]
      })

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

      const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.getAddress()

      chai.expect(batchTransaction).to.be.deep.equal({
        to: multiSendContractAddress,
        value: '0',
        data: '0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000432003bf50d1ccca81d4f03c1e71820250fbd8b01eb87000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002041688f0b900000000000000000000000031233647996a4e0d623c9ba42ce8538c2531e22b0000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000003f20fb66d809929e59d9ab1e725d307d696b5593000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008c2982b9b2561d80ea09400162752e2538d6af73000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001846a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      })
    }
  )

  itif(safeVersionDeployed == '1.3.0')(
    'should return a batch transaction with the Safe deployment Transaction and the Safe Transaction',
    async () => {
      const { accounts, contractNetworks, predictedSafe, provider } = await setupTests()
      const [, account2] = accounts

      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })

      const safeTransactionData = {
        to: account2.address,
        value: AMOUNT_TO_TRANSFER,
        data: '0x'
      }

      const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData]
      })

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

      const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.getAddress()

      chai.expect(batchTransaction).to.be.deep.equal({
        to: multiSendContractAddress,
        value: '0',
        data: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000043200359d208d80e7049b8128e64a4d94d9d78c9293e1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002041688f0b90000000000000000000000008e6332da7ccd5430bfb27df39fbf386b463c31a50000000000000000000000000000000000000000000000000000000000000060a98fb6a6903d95297bfda0abd3057d6e6bf929ab54c89dad163c30546c8040410000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000085692cd6f0b50e6d48b98153cba504a09564e776000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bf834dc30c3b4a274a34fcba2b9735af097d3769000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001846a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      })
    }
  )

  itif(safeVersionDeployed >= '1.3.0')(
    'should include the custom salt nonce in the Safe deployment data',
    async () => {
      const { accounts, contractNetworks, predictedSafe, provider } = await setupTests()
      const [, account2] = accounts

      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })

      const safeTransactionData = {
        to: account2.address,
        value: AMOUNT_TO_TRANSFER,
        data: '0x'
      }

      const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData]
      })

      const customSaltNonce = '123456789'

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(
        safeTransaction,
        {}, // transaction options
        customSaltNonce
      )

      const customSaltNonceEncoded = safeSdk
        .getSafeProvider()
        .encodeParameters(['uint256'], [customSaltNonce])

      // custom salt nonce included in the deployment data
      chai.expect(batchTransaction.data).to.contains(customSaltNonceEncoded.replace('0x', ''))
    }
  )
})
