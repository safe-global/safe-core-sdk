import { safeVersionDeployed } from '@safe-global/protocol-kit/hardhat/deploy/deploy-contracts'
import Safe, {
  PredictedSafeProps,
  SafeTransactionOptionalProps
} from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import { itif } from './utils/helpers'
import { getContractNetworks } from './utils/setupContractNetworks'
import { getDebugTransactionGuard, getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe guard manager', () => {
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
      debugTransactionGuard: await getDebugTransactionGuard(),
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks,
      predictedSafe
    }
  })

  describe('getGuard', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if getting the enabled guard is not supported',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx = safeSdk.getGuard()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support Safe transaction guards functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })
      chai.expect(safeSdk.getGuard()).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should return 0x address when no Safe guard is enabled',
      async () => {
        const { safe, accounts, contractNetworks } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        chai.expect(await safeSdk.getGuard()).to.be.eq(ZERO_ADDRESS)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should return the enabled Safe guard', async () => {
      const { safe, accounts, contractNetworks, debugTransactionGuard } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getGuard()).to.be.eq(ZERO_ADDRESS)
      const tx = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getGuard()).to.be.eq(debugTransactionGuard.address)
    })
  })

  describe('createEnableGuardTx', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if enabling a Safe guard is not supported',
      async () => {
        const { safe, accounts, contractNetworks, debugTransactionGuard } = await setupTests()
        const [account1] = accounts
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx = safeSdk.createEnableGuardTx(debugTransactionGuard.address)
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support Safe transaction guards functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if the Safe is not deployed', async () => {
      const { predictedSafe, accounts, debugTransactionGuard, contractNetworks } =
        await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')('should fail if address is invalid', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createEnableGuardTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid guard address provided')
    })

    itif(safeVersionDeployed >= '1.3.0')(
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
        const tx = safeSdk.createEnableGuardTx(ZERO_ADDRESS)
        await chai.expect(tx).to.be.rejectedWith('Invalid guard address provided')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if address is already enabled', async () => {
      const { safe, accounts, contractNetworks, debugTransactionGuard } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx1 = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      const txResponse = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse)
      const tx2 = safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      await chai.expect(tx2).to.be.rejectedWith('Guard provided is already enabled')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should build the transaction with the optional props',
      async () => {
        const { safe, accounts, contractNetworks, debugTransactionGuard } = await setupTests()
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
        const tx = await safeSdk.createEnableGuardTx(debugTransactionGuard.address, options)
        chai.expect(tx.data.baseGas).to.be.eq(111)
        chai.expect(tx.data.gasPrice).to.be.eq(222)
        chai.expect(tx.data.gasToken).to.be.eq('0x333')
        chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx.data.nonce).to.be.eq(555)
        chai.expect(tx.data.safeTxGas).to.be.eq(666)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should enable a Safe guard', async () => {
      const { safe, accounts, contractNetworks, debugTransactionGuard } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getGuard()).to.be.eq(ZERO_ADDRESS)
      const tx = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getGuard()).to.be.eq(debugTransactionGuard.address)
    })
  })

  describe('createDisableGuardTx', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if disabling a Safe guard is not supported',
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
        const tx = safeSdk.createDisableGuardTx()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support Safe transaction guards functionality'
          )
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if the Safe is not deployed', async () => {
      const { accounts, predictedSafe, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createDisableGuardTx()
      await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')('should fail if no Safe guard is enabled', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.createDisableGuardTx()
      await chai.expect(tx).to.be.rejectedWith('There is no guard enabled yet')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should build the transaction with the optional props',
      async () => {
        const { accounts, contractNetworks, debugTransactionGuard } = await setupTests()
        const [account1] = accounts
        const safe = await getSafeWithOwners([account1.address])
        const ethAdapter = await getEthAdapter(account1.signer)
        const safeSdk = await Safe.create({
          ethAdapter,
          safeAddress: safe.address,
          contractNetworks
        })
        const tx1 = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai.expect(await safeSdk.getGuard()).to.be.eq(debugTransactionGuard.address)
        const options: SafeTransactionOptionalProps = {
          baseGas: 111,
          gasPrice: 222,
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: 666
        }
        const tx2 = await safeSdk.createDisableGuardTx(options)
        chai.expect(tx2.data.baseGas).to.be.eq(111)
        chai.expect(tx2.data.gasPrice).to.be.eq(222)
        chai.expect(tx2.data.gasToken).to.be.eq('0x333')
        chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx2.data.nonce).to.be.eq(555)
        chai.expect(tx2.data.safeTxGas).to.be.eq(666)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should disable an enabled Safe guard', async () => {
      const { accounts, contractNetworks, debugTransactionGuard } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })

      const tx = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getGuard()).to.be.eq(debugTransactionGuard.address)

      const tx1 = await safeSdk.createDisableGuardTx()
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await waitSafeTxReceipt(txResponse1)
      chai.expect(await safeSdk.getGuard()).to.be.eq(ZERO_ADDRESS)
    })
  })
})
