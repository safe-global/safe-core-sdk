import {
  safeVersionDeployed,
  setupTests,
  getDebugModuleGuard,
  itif
} from '@safe-global/testing-kit'
import Safe, { SafeTransactionOptionalProps } from '@safe-global/protocol-kit/index'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/utils/constants'
import semverSatisfies from 'semver/functions/satisfies.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe module guard manager', () => {
  const provider = getEip1193Provider()

  describe('getModuleGuard', async () => {
    itif(!semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if getting the enabled module guard is not supported',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.getModuleGuard()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support module guard functionality'
          )
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if the Safe is not deployed',
      async () => {
        const { predictedSafe, contractNetworks } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        chai.expect(safeSdk.getModuleGuard()).to.be.rejectedWith('Safe is not deployed')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should return 0x address when no Safe module guard is enabled',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(ZERO_ADDRESS)
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should return the enabled Safe module guard',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(ZERO_ADDRESS)
        const tx = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(debugModuleGuard.address)
      }
    )
  })

  describe('createEnableModuleGuardTx', async () => {
    itif(!semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if enabling a Safe module guard is not supported',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support module guard functionality'
          )
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if the Safe is not deployed',
      async () => {
        const { predictedSafe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if address is invalid',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableModuleGuardTx('0x123')
        await chai.expect(tx).to.be.rejectedWith('Invalid module guard address provided')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if address is equal to 0x address',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createEnableModuleGuardTx(ZERO_ADDRESS)
        await chai.expect(tx).to.be.rejectedWith('Invalid module guard address provided')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if address is already enabled',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx1 = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        const txResponse = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse)
        const tx2 = safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        await chai.expect(tx2).to.be.rejectedWith('Module guard provided is already enabled')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should build the transaction with the optional props',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
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
        const tx = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address, options)
        chai.expect(tx.data.baseGas).to.be.eq('111')
        chai.expect(tx.data.gasPrice).to.be.eq('222')
        chai.expect(tx.data.gasToken).to.be.eq('0x333')
        chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx.data.nonce).to.be.eq(555)
        chai.expect(tx.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should enable a Safe module guard',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(ZERO_ADDRESS)
        const tx = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(debugModuleGuard.address)
      }
    )
  })

  describe('createDisableModuleGuardTx', async () => {
    itif(!semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if disabling a Safe module guard is not supported',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createDisableModuleGuardTx()
        await chai
          .expect(tx)
          .to.be.rejectedWith(
            'Current version of the Safe does not support module guard functionality'
          )
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if the Safe is not deployed',
      async () => {
        const { predictedSafe, contractNetworks } = await setupTests()
        const safeSdk = await Safe.init({
          provider,
          predictedSafe,
          contractNetworks
        })
        const tx = safeSdk.createDisableModuleGuardTx()
        await chai.expect(tx).to.be.rejectedWith('Safe is not deployed')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should fail if no Safe module guard is enabled',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx = safeSdk.createDisableModuleGuardTx()
        await chai.expect(tx).to.be.rejectedWith('There is no module guard enabled yet')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should build the transaction with the optional props',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })
        const tx1 = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(debugModuleGuard.address)
        const options: SafeTransactionOptionalProps = {
          baseGas: '111',
          gasPrice: '222',
          gasToken: '0x333',
          refundReceiver: '0x444',
          nonce: 555,
          safeTxGas: '666'
        }
        const tx2 = await safeSdk.createDisableModuleGuardTx(options)
        chai.expect(tx2.data.baseGas).to.be.eq('111')
        chai.expect(tx2.data.gasPrice).to.be.eq('222')
        chai.expect(tx2.data.gasToken).to.be.eq('0x333')
        chai.expect(tx2.data.refundReceiver).to.be.eq('0x444')
        chai.expect(tx2.data.nonce).to.be.eq(555)
        chai.expect(tx2.data.safeTxGas).to.be.eq('666')
      }
    )

    itif(semverSatisfies(safeVersionDeployed, '>=1.5.0'))(
      'should disable an enabled Safe module guard',
      async () => {
        const { safe, contractNetworks } = await setupTests()
        const debugModuleGuard = await getDebugModuleGuard()
        const safeAddress = safe.address
        const safeSdk = await Safe.init({
          provider,
          safeAddress,
          contractNetworks
        })

        const tx = await safeSdk.createEnableModuleGuardTx(debugModuleGuard.address)
        const txResponse = await safeSdk.executeTransaction(tx)
        await waitSafeTxReceipt(txResponse)
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(debugModuleGuard.address)

        const tx1 = await safeSdk.createDisableModuleGuardTx()
        const txResponse1 = await safeSdk.executeTransaction(tx1)
        await waitSafeTxReceipt(txResponse1)
        chai.expect(await safeSdk.getModuleGuard()).to.be.eq(ZERO_ADDRESS)
      }
    )
  })
})
