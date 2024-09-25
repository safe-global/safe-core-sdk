import {
  safeVersionDeployed,
  setupTests,
  getDebugTransactionGuard,
  itif
} from '@safe-global/testing-kit'
import Safe, { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe guard manager', () => {
  const provider = getEip1193Provider()

  describe('getGuard', async () => {
    itif(safeVersionDeployed < '1.3.0')(
      'should fail if getting the enabled guard is not supported',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
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
      const { predictedSafe, contractNetworks } = await setupTests()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      chai.expect(safeSdk.getGuard()).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should return 0x address when no Safe guard is enabled',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        chai.expect(await safeSdk.getGuard()).to.be.eq(ZERO_ADDRESS)
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should return the enabled Safe guard', async () => {
      const { safe, contractNetworks } = await setupTests()
      const debugTransactionGuard = await getDebugTransactionGuard()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
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
        const { safe, contractNetworks } = await setupTests()
        const debugTransactionGuard = await getDebugTransactionGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
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
      const { predictedSafe, contractNetworks } = await setupTests()
      const debugTransactionGuard = await getDebugTransactionGuard()
      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createEnableGuardTx(debugTransactionGuard.address)
      await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')('should fail if address is invalid', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createEnableGuardTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid guard address provided')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should fail if address is equal to 0x address',
      async () => {
        const { safe, contractNetworks } = await setupTests()

        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableGuardTx(ZERO_ADDRESS)
        await chai.expect(tx).to.be.rejectedWith('Invalid guard address provided')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should fail if address is already enabled', async () => {
      const { safe, contractNetworks } = await setupTests()
      const debugTransactionGuard = await getDebugTransactionGuard()

      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
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
        const { safe, contractNetworks } = await setupTests()
        const debugTransactionGuard = await getDebugTransactionGuard()

        const safeAddress = safe.address
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
        const tx = await safeSdk.createEnableGuardTx(debugTransactionGuard.address, options)
        chai.expect(tx.data.baseGas).to.be.eq('111')
        chai.expect(tx.data.gasPrice).to.be.eq('222')
        chai.expect(tx.data.gasToken).to.be.eq('0x333')
        chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx.data.nonce).to.be.eq(555)
        chai.expect(tx.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should enable a Safe guard', async () => {
      const { safe, contractNetworks } = await setupTests()
      const debugTransactionGuard = await getDebugTransactionGuard()

      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
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
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
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
      const { predictedSafe, contractNetworks } = await setupTests()

      const safeSdk = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks
      })
      const tx = safeSdk.createDisableGuardTx()
      await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
    })

    itif(safeVersionDeployed >= '1.3.0')('should fail if no Safe guard is enabled', async () => {
      const { safe, contractNetworks } = await setupTests()

      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })
      const tx = safeSdk.createDisableGuardTx()
      await chai.expect(tx).to.be.rejectedWith('There is no guard enabled yet')
    })

    itif(safeVersionDeployed >= '1.3.0')(
      'should build the transaction with the optional props',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugTransactionGuard = await getDebugTransactionGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx1 = await safeSdk.createEnableGuardTx(debugTransactionGuard.address)
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai.expect(await safeSdk.getGuard()).to.be.eq(debugTransactionGuard.address)
        const options: SafeTransactionOptionalProps = {
          baseGas: '111',
          gasPrice: '222',
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: '666'
        }
        const tx2 = await safeSdk.createDisableGuardTx(options)
        chai.expect(tx2.data.baseGas).to.be.eq('111')
        chai.expect(tx2.data.gasPrice).to.be.eq('222')
        chai.expect(tx2.data.gasToken).to.be.eq('0x333')
        chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx2.data.nonce).to.be.eq(555)
        chai.expect(tx2.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(safeVersionDeployed >= '1.3.0')('should disable an enabled Safe guard', async () => {
      const { safe, contractNetworks } = await setupTests()
      const debugTransactionGuard = await getDebugTransactionGuard()
      const safeAddress = safe.address
      const safeSdk = await Safe.init({
        provider,
        safeAddress,
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
