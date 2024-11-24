import { setupTests, safeVersionDeployed } from '@safe-global/testing-kit'
import Safe, { PredictedSafeProps, SafeAccountConfig } from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { getEip1193Provider } from './utils/setupProvider'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('On-chain analytics', () => {
  const provider = getEip1193Provider()

  describe('getTrackId method', () => {
    it('should return the correctly formatted track id when provided', async () => {
      const trackId = 'test-track-id'
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        trackId
      })

      const formattedTrackId = '7ba67a7e86c9fad9f51790e7e60307f882b9c492'

      chai.expect(formattedTrackId).to.equals(protocolKit.getTrackId())
    })

    it('should return an empty string when no track id is provided', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks
      })

      chai.expect(protocolKit.getTrackId()).to.empty
    })
  })

  describe('Tracking Safe Deployment on Chain via the transaction data field', () => {
    it('should append the formatted trackId to the deployment transaction data field', async () => {
      const trackId = 'test-track-id'

      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const owners = [account1.address, account2.address]
      const threshold = 1
      const safeAccountConfig: SafeAccountConfig = { owners, threshold }
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          safeVersion: safeVersionDeployed
        }
      }

      const protocolKit = await Safe.init({
        provider,
        predictedSafe,
        contractNetworks,
        trackId
      })

      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()

      const formattedTrackId = '7ba67a7e86c9fad9f51790e7e60307f882b9c492'

      chai.expect(formattedTrackId).to.equals(protocolKit.getTrackId())
      chai.expect(deploymentTransaction.data.endsWith(formattedTrackId)).to.be.true
    })
  })

  describe('Tracking Safe transactions on Chain via the transaction data field', () => {
    it('should append the formatted trackId to the exec transaction data field', async () => {
      const trackId = 'test-track-id'
      const { safe, contractNetworks } = await setupTests()
      const safeAddress = safe.address

      const protocolKit = await Safe.init({
        provider,
        safeAddress,
        contractNetworks,
        trackId
      })

      const testTransaction = {
        to: safeAddress,
        value: '0',
        data: '0x'
      }

      const safeTransaction = await protocolKit.createTransaction({
        transactions: [testTransaction]
      })

      const isValidTransaction = await protocolKit.isValidTransaction(safeTransaction)
      chai.expect(isValidTransaction).to.be.eq(true)

      const transactionResponse = await protocolKit.executeTransaction(safeTransaction)

      await waitSafeTxReceipt(transactionResponse)

      const transaction = await protocolKit
        .getSafeProvider()
        .getTransaction(transactionResponse.hash)

      const formattedTrackId = '7ba67a7e86c9fad9f51790e7e60307f882b9c492'

      chai.expect(formattedTrackId).to.equals(protocolKit.getTrackId())
      chai.expect(transaction.input.endsWith(formattedTrackId)).to.be.true
    })
  })
})
