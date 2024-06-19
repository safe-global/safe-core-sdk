import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

describe('getSafeOperationConfirmations', () => {
  before(async () => {
    safeApiKit = getApiKit(TX_SERVICE_URL)
  })

  it('should fail if safeOperationHash is empty', async () => {
    await chai
      .expect(safeApiKit.getSafeOperationConfirmations({ safeOperationHash: '' }))
      .to.be.rejectedWith('Invalid SafeOperation hash')
  })

  it('should return an empty array if the safeOperationHash is not found', async () => {
    const safeOperationHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations({
      safeOperationHash
    })
    chai.expect(safeOpConfirmations.count).to.be.equal(0)
    chai.expect(safeOpConfirmations.results.length).to.be.equal(0)
  })

  it('should return the transaction with the given safeOperationHash', async () => {
    const safeOperationHash = '0x375d3bd580600ce04d7d2c1d8d88d85f27b9c7d14d7b544f2ee585d672f2b449'
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations({
      safeOperationHash
    })
    chai.expect(safeOpConfirmations.count).to.be.equal(2)
    chai.expect(safeOpConfirmations.results.length).to.be.equal(2)
  })
})
