import SafeApiKit from '@safe-global/api-kit/index'
import { Address } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // v1.4.1
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

let safeApiKit: SafeApiKit

describe('getPendingSafeOperations', () => {
  before(async () => {
    safeApiKit = getApiKit(TX_SERVICE_URL)
  })

  describe('should fail', () => {
    it('should fail if safeAddress is empty', async () => {
      await chai
        .expect(safeApiKit.getPendingSafeOperations('' as Address))
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('should fail if safeAddress is invalid', async () => {
      await chai
        .expect(safeApiKit.getPendingSafeOperations('0x123'))
        .to.be.rejectedWith('Invalid Ethereum address 0x123')
    })
  })

  it('should get pending safe operations', async () => {
    const allSafeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)

    // Prepared 2 executed SafeOperations in the E2E Safe account
    const pendingSafeOperations = await safeApiKit.getPendingSafeOperations(SAFE_ADDRESS)

    const executedSafeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, {
      executed: true
    })

    chai.expect(executedSafeOperations.count).equals(2)
    chai.expect(allSafeOperations.count - pendingSafeOperations.count).equals(2)
  })
})
