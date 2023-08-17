import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit/index'
import { getContractNetworks } from './utils/setupContractNetworks'
import { itif } from './utils/helpers'
import { getSafeWithOwners, getMultiSendCallOnly } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

const AMOUNT_TO_TRANSFER = '500000000000000000' // 0.5 ETH

describe('wrapSafeTransactionIntoDeploymentBatch', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
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

  it('should throw an error if the Safe is already deployed', async () => {
    const { accounts, contractNetworks } = await setupTests()
    const [account1, account2] = accounts

    const safe = await getSafeWithOwners([account1.address])
    const ethAdapter = await getEthAdapter(account1.signer)

    const safeSdk = await Safe.create({
      ethAdapter,
      safeAddress: safe.address,
      contractNetworks
    })

    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData: {
        to: account2.address,
        value: AMOUNT_TO_TRANSFER,
        data: '0x'
      }
    })

    await chai
      .expect(safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction))
      .to.be.rejectedWith('Safe already deployed')
  })

  itif(safeVersionDeployed == '1.4.1')(
    'should return a batch transaction with the Safe deployment Transaction and the Safe Transaction',
    async () => {
      const { accounts, contractNetworks, predictedSafe } = await setupTests()
      const [account1, account2] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })

      const safeTransaction = await safeSdk.createTransaction({
        safeTransactionData: {
          to: account2.address,
          value: AMOUNT_TO_TRANSFER,
          data: '0x'
        }
      })

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

      const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.address

      chai.expect(batchTransaction).to.be.deep.equal({
        to: multiSendContractAddress,
        value: '0',
        data: '0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000432003bf50d1ccca81d4f03c1e71820250fbd8b01eb87000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002041688f0b900000000000000000000000031233647996a4e0d623c9ba42ce8538c2531e22b0000000000000000000000000000000000000000000000000000000000000060b1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f900000000000000000000000000000000000000000000000000000000000000164b63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000003f20fb66d809929e59d9ab1e725d307d696b5593000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024ed511cd29a6cecf83f9a383a16e22fe74730f9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001846a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      })
    }
  )

  itif(safeVersionDeployed == '1.3.0')(
    'should return a batch transaction with the Safe deployment Transaction and the Safe Transaction',
    async () => {
      const { accounts, contractNetworks, predictedSafe } = await setupTests()
      const [account1, account2] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })

      const safeTransaction = await safeSdk.createTransaction({
        safeTransactionData: {
          to: account2.address,
          value: AMOUNT_TO_TRANSFER,
          data: '0x'
        }
      })

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTransaction)

      const multiSendContractAddress = await (await getMultiSendCallOnly()).contract.address

      chai.expect(batchTransaction).to.be.deep.equal({
        to: multiSendContractAddress,
        value: '0',
        data: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000043200359d208d80e7049b8128e64a4d94d9d78c9293e1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002041688f0b90000000000000000000000008e6332da7ccd5430bfb27df39fbf386b463c31a50000000000000000000000000000000000000000000000000000000000000060b1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f900000000000000000000000000000000000000000000000000000000000000164b63e800d000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000085692cd6f0b50e6d48b98153cba504a09564e776000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090f8bf6a479f320ead074411a4b0e7944ea8c9c10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042452bcdbdee8d9aa9363b1f7a051e0f9f656ecf000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001846a761202000000000000000000000000ffcf8fdee72ac11b5c542428b35eef5769c409f000000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      })
    }
  )

  itif(safeVersionDeployed >= '1.3.0')(
    'should include the custom salt nonce in the Safe deployment data',
    async () => {
      const { accounts, contractNetworks, predictedSafe } = await setupTests()
      const [account1, account2] = accounts

      const ethAdapter = await getEthAdapter(account1.signer)

      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })

      const safeTransaction = await safeSdk.createTransaction({
        safeTransactionData: {
          to: account2.address,
          value: AMOUNT_TO_TRANSFER,
          data: '0x'
        }
      })

      const customSaltNonce = '123456789'

      const batchTransaction = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(
        safeTransaction,
        {}, // transaction options
        customSaltNonce
      )

      const customSaltNonceEncoded = ethAdapter.encodeParameters(['uint256'], [customSaltNonce])

      // custom salt nonce included in the deployment data
      chai.expect(batchTransaction.data).to.contains(customSaltNonceEncoded.replace('0x', ''))
    }
  )
})
