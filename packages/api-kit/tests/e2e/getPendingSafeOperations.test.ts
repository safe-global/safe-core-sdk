import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'
import { Address } from 'viem'
import { getSafeWith4337Module, safeVersionDeployed } from 'tests/helpers/safe'
import { describeif } from 'tests/utils/heplers'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describeif(safeVersionDeployed >= '1.4.1')('getPendingSafeOperations', () => {
  const SAFE_ADDRESS: Address = getSafeWith4337Module()
  before(async () => {
    safeApiKit = getApiKit()
  })

  describe('should fail', () => {
    it('should fail if safeAddress is empty', async () => {
      await chai
        .expect(safeApiKit.getPendingSafeOperations(''))
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
