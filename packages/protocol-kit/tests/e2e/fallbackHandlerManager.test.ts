import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeTransactionOptionalProps
} from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getCompatibilityFallbackHandler,
  getDefaultCallbackHandler,
  getSafeWithOwners
} from './utils/setupContracts'
import { getEip1193Provider } from './utils/setupProvider'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Fallback handler manager', () => {
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
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks,
      defaultCallbackHandler: await getDefaultCallbackHandler(),
      predictedSafe,
      provider
    }
  })

  describe('getFallbackHandler', async () => {
    itif(safeVersionDeployed < '1.1.1')(
      'should fail if getting the enabled fallback handler is not supported',
      async () => {
        const { safe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.getFallbackHandler()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support the fallback handler functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, contractNetworks, provider } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai.expect(safeSdk.getFallbackHandler()).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.1.1')('should return the enabled fallback handler', async () => {
      const { safe, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const compatibilityFallbackHandler = await (
        await getCompatibilityFallbackHandler()
      ).contract.getAddress()
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(compatibilityFallbackHandler)
      const tx = await safeSdk.createEnableFallbackHandlerTx(
        await defaultCallbackHandler.getAddress()
      )
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai
        .expect(await safeSdk.getFallbackHandler())
        .to.be.eq(await defaultCallbackHandler.getAddress())
    })
  })

  describe('createEnableFallbackHandlerTx', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if the Safe with version <v1.3.0 is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, defaultCallbackHandler, provider } =
          await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(await defaultCallbackHandler.getAddress())
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should fail if the Safe with version >=v1.3.0 is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, defaultCallbackHandler, provider } =
          await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(await defaultCallbackHandler.getAddress())
        await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
      }
    )

    itif(safeVersionDeployed < '1.1.1')(
      'should fail if enabling a fallback handler is not supported',
      async () => {
        const { safe, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(await defaultCallbackHandler.getAddress())
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support the fallback handler functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should fail if address is invalid', async () => {
      const { safe, contractNetworks, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createEnableFallbackHandlerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid fallback handler address provided')
    })

    itif(safeVersionDeployed >= '1.1.1')(
      'should fail if address is equal to 0x address',
      async () => {
        const { safe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(ZERO_ADDRESS)
        await chai.expect(tx).to.be.rejectedWith('Invalid fallback handler address provided')
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should fail if address is already enabled', async () => {
      const { safe, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx1 = await safeSdk.createEnableFallbackHandlerTx(
        await defaultCallbackHandler.getAddress()
      )
      const txResponse = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse)
      const tx2 = safeSdk.createEnableFallbackHandlerTx(await defaultCallbackHandler.getAddress())
      await chai.expect(tx2).to.be.rejectedWith('Fallback handler provided is already enabled')
    })

    itif(safeVersionDeployed >= '1.1.1')(
      'should build the transaction with the optional props',
      async () => {
        const { safe, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const options: SafeTransactionOptionalProps = {
          baseGas: '111',
          gasPrice: '222',
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: '666'
        }
        const tx = await safeSdk.createEnableFallbackHandlerTx(
          await defaultCallbackHandler.getAddress(),
          options
        )
        chai.expect(tx.data.baseGas).to.be.eq('111')
        chai.expect(tx.data.gasPrice).to.be.eq('222')
        chai.expect(tx.data.gasToken).to.be.eq('0x333')
        chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx.data.nonce).to.be.eq(555)
        chai.expect(tx.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should enable a fallback handler', async () => {
      const { safe, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const compatibilityFallbackHandler = await (
        await getCompatibilityFallbackHandler()
      ).contract.getAddress()
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(compatibilityFallbackHandler)
      const tx = await safeSdk.createEnableFallbackHandlerTx(
        await defaultCallbackHandler.getAddress()
      )
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai
        .expect(await safeSdk.getFallbackHandler())
        .to.be.eq(await defaultCallbackHandler.getAddress())
    })
  })

  describe('createDisableFallbackHandlerTx', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if the Safe with version <v1.3.0 is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, provider } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createDisableFallbackHandlerTx()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Account Abstraction functionality is not available for Safes with version lower than v1.3.0'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')(
      'should fail if the Safe with version >=v1.3.0 is not deployed',
      async () => {
        const { predictedSafe, contractNetworks, defaultCallbackHandler, provider } =
          await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createDisableFallbackHandlerTx(await defaultCallbackHandler.getAddress())
        await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
      }
    )

    itif(safeVersionDeployed < '1.1.1')(
      'should fail if disabling a fallback handler is not supported',
      async () => {
        const { accounts, contractNetworks, provider } = await setupTests()
        const [account1] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createDisableFallbackHandlerTx()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support the fallback handler functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.1.1')(
      'should fail if no fallback handler is enabled',
      async () => {
        const { safe, contractNetworks, provider } = await setupTests()
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const tx = await safeSdk.createDisableFallbackHandlerTx()
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)
        chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(ZERO_ADDRESS)

        const tx2 = safeSdk.createDisableFallbackHandlerTx()
        await chai.expect(tx2).to.be.rejectedWith('There is no fallback handler enabled yet')
      }
    )

    itif(safeVersionDeployed >= '1.1.1')(
      'should build the transaction with the optional props',
      async () => {
        const { accounts, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
        const [account1] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const safeAddress = await safe.getAddress()
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const tx1 = await safeSdk.createEnableFallbackHandlerTx(
          await defaultCallbackHandler.getAddress()
        )
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai
          .expect(await safeSdk.getFallbackHandler())
          .to.be.eq(await defaultCallbackHandler.getAddress())
        const options: SafeTransactionOptionalProps = {
          baseGas: '111',
          gasPrice: '222',
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: '666'
        }
        const tx2 = await safeSdk.createDisableFallbackHandlerTx(options)
        chai.expect(tx2.data.baseGas).to.be.eq('111')
        chai.expect(tx2.data.gasPrice).to.be.eq('222')
        chai.expect(tx2.data.gasToken).to.be.eq('0x333')
        chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx2.data.nonce).to.be.eq(555)
        chai.expect(tx2.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should disable an enabled fallback handler', async () => {
      const { accounts, contractNetworks, defaultCallbackHandler, provider } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const safeAddress = await safe.getAddress()
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      const tx = await safeSdk.createEnableFallbackHandlerTx(
        await defaultCallbackHandler.getAddress()
      )
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      await new Promise((resolve) => setTimeout(resolve, 500))
      chai
        .expect(await safeSdk.getFallbackHandler())
        .to.be.eq(await defaultCallbackHandler.getAddress())

      const tx1 = await safeSdk.createDisableFallbackHandlerTx()
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(ZERO_ADDRESS)
    })
  })
})
