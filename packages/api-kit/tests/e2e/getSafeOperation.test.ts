import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'
import { getSafeWith4337Module, safeVersionDeployed } from 'tests/helpers/safe'
import { describeif } from 'tests/utils/heplers'
import { Address } from 'viem'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describeif(safeVersionDeployed === '1.4.1')('getSafeOperation', () => {
  let safeAddress: Address

  before(async () => {
    safeAddress = getSafeWith4337Module()
    safeApiKit = getApiKit()
  })

  describe('should fail', () => {
    it('should fail if safeOperationHash is empty', async () => {
      await chai
        .expect(safeApiKit.getSafeOperation(''))
        .to.be.rejectedWith('SafeOperation hash must not be empty')
    })

    it('should fail if safeOperationHash is invalid', async () => {
      await chai.expect(safeApiKit.getSafeOperation('0x123')).to.be.rejectedWith('Not found.')
    })
  })

  it('should get the SafeOperation', async () => {
    const safeOperations = await safeApiKit.getSafeOperationsByAddress(safeAddress)
    chai.expect(safeOperations.results.length).to.have.above(0)

    const safeOperationHash = safeOperations.results[0].safeOperationHash

    const safeOperation = await safeApiKit.getSafeOperation(safeOperationHash)

    chai.expect(safeOperation).to.deep.eq(safeOperations.results[0])
  })
})
