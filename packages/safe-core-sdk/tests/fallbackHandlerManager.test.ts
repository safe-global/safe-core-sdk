import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { safeVersionDeployed } from '../hardhat/deploy/deploy-contracts'
import Safe, { SafeTransactionOptionalProps } from '../src'
import { ZERO_ADDRESS } from './../src/utils/constants'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import {
  getCompatibilityFallbackHandler,
  getDefaultCallbackHandler,
  getSafeWithOwners
} from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Fallback handler manager', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks = await getContractNetworks(chainId)
    return {
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks,
      defaultCallbackHandler: await getDefaultCallbackHandler()
    }
  })

  describe('getFallbackHandler', async () => {
    itif(safeVersionDeployed < '1.1.1')(
      'should fail if getting the enabled fallback handler is not supported',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx = safeSdk.getFallbackHandler()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support Safe the fallback handler functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should return the enabled fallback handler', async () => {
      const { safe, accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const compatibilityFallbackHandler = (await getCompatibilityFallbackHandler()).contract
        .address
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(compatibilityFallbackHandler)
      const tx = await safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(defaultCallbackHandler.address)
    })
  })

  describe('createEnableFallbackHandlerTx', async () => {
    itif(safeVersionDeployed < '1.1.1')(
      'should fail if enabling a fallback handler is not supported',
      async () => {
        const { safe, accounts, contractNetworks, fallbackHandlerAddress } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(fallbackHandlerAddress)
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support the fallback handler functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should fail if address is invalid', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createEnableFallbackHandlerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid fallback handler address provided')
    })

    itif(safeVersionDeployed >= '1.1.1')(
      'should fail if address is equal to 0x address',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx = safeSdk.createEnableFallbackHandlerTx(ZERO_ADDRESS)
        await chai.expect(tx).to.be.rejectedWith('Invalid fallback handler address provided')
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should fail if address is already enabled', async () => {
      const { safe, accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx1 = await safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
      const txResponse = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse)
      const tx2 = safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
      await chai.expect(tx2).to.be.rejectedWith('Fallback handler provided is already enabled')
    })

    itif(safeVersionDeployed >= '1.1.1')(
      'should build the transaction with the optional props',
      async () => {
        const { safe, accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const options: SafeTransactionOptionalProps = {
          baseGas: 111,
          gasPrice: 222,
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: 666
        }
        const tx = await safeSdk.createEnableFallbackHandlerTx(
          defaultCallbackHandler.address,
          options
        )
        chai.expect(tx.data.baseGas).to.be.eq(111)
        chai.expect(tx.data.gasPrice).to.be.eq(222)
        chai.expect(tx.data.gasToken).to.be.eq('0x333')
        chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx.data.nonce).to.be.eq(555)
        chai.expect(tx.data.safeTxGas).to.be.eq(666)
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should enable a fallback handler', async () => {
      const { safe, accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const compatibilityFallbackHandler = (await getCompatibilityFallbackHandler()).contract
        .address
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(compatibilityFallbackHandler)
      const tx = await safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(defaultCallbackHandler.address)
    })
  })

  describe('createDisableFallbackHandlerTx', async () => {
    itif(safeVersionDeployed < '1.1.1')(
      'should fail if disabling a fallback handler is not supported',
      async () => {
        const { accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
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
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
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
        const { accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
        const [account1] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })

        const tx1 = await safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(defaultCallbackHandler.address)
        const options: SafeTransactionOptionalProps = {
          baseGas: 111,
          gasPrice: 222,
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: 666
        }
        const tx2 = await safeSdk.createDisableFallbackHandlerTx(options)
        chai.expect(tx2.data.baseGas).to.be.eq(111)
        chai.expect(tx2.data.gasPrice).to.be.eq(222)
        chai.expect(tx2.data.gasToken).to.be.eq('0x333')
        chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx2.data.nonce).to.be.eq(555)
        chai.expect(tx2.data.safeTxGas).to.be.eq(666)
      }
    )

    itif(safeVersionDeployed >= '1.1.1')('should disable an enabled fallback handler', async () => {
      const { accounts, contractNetworks, defaultCallbackHandler } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })

      const tx = await safeSdk.createEnableFallbackHandlerTx(defaultCallbackHandler.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(defaultCallbackHandler.address)

      const tx1 = await safeSdk.createDisableFallbackHandlerTx()
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      chai.expect(await safeSdk.getFallbackHandler()).to.be.eq(ZERO_ADDRESS)
    })
  })
})
