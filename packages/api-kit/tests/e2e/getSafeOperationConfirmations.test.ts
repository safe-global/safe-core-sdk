import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'
import { zeroHash } from 'viem'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

const SAFE_OPERATION_HASH = '0x9d473e819a15ef68d253a31d56e8da9c982d8d589171c0640d673e3ebf4efff7'
const EXPECTED_SAFE_OPERATION_CONFIRMATIONS = [
  {
    created: '2025-02-05T09:57:34.085839Z',
    modified: '2025-02-05T09:57:34.085839Z',
    owner: '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    signature:
      '0x564109d2728c7e902ee3b7296b1473e1b9778a2d46ea6f2b5496474553d17b2c4d4a5fc9991ac6bb8cc786f029762624348bde1d11d76579e4d28874eaf461ba1b',
    signatureType: 'EOA'
  },
  {
    created: '2025-02-05T09:57:35.660515Z',
    modified: '2025-02-05T09:57:35.660515Z',
    owner: '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    signature:
      '0x8147447f780d306ad3436212f11e8c5f174e9fbbd519e6258d88db87369f385127af10385e68bbe9dc9d4544bbad32a0327632a8414bd8d1d0f691ed844c142f1c',
    signatureType: 'EOA'
  }
]

describe('getSafeOperationConfirmations', () => {
  before(() => {
    safeApiKit = getApiKit()
  })

  it('should fail if safeOperationHash is empty', async () => {
    await chai
      .expect(safeApiKit.getSafeOperationConfirmations(''))
      .to.be.rejectedWith('Invalid SafeOperation hash')
  })

  it('should return an empty array if the safeOperationHash is not found', async () => {
    const safeOperationHash = zeroHash
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations(safeOperationHash)
    chai.expect(safeOpConfirmations.count).to.be.equal(0)
    chai.expect(safeOpConfirmations.results.length).to.be.equal(0)
  })

  it('should return the confirmations for the given safeOperationHash', async () => {
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations(SAFE_OPERATION_HASH)
    chai.expect(safeOpConfirmations.count).to.be.equal(2)
    chai.expect(safeOpConfirmations.results.length).to.be.equal(2)
    chai.expect(safeOpConfirmations.results).to.deep.equal(EXPECTED_SAFE_OPERATION_CONFIRMATIONS)
  })

  it('should return only the first confirmation if limit = 1', async () => {
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations(
      SAFE_OPERATION_HASH,
      { limit: 1 }
    )
    chai.expect(safeOpConfirmations.count).to.be.equal(2)
    chai
      .expect(safeOpConfirmations.results)
      .to.deep.equal([EXPECTED_SAFE_OPERATION_CONFIRMATIONS[0]])
  })

  it('should return only the second confirmation if offset = 1', async () => {
    const safeOpConfirmations = await safeApiKit.getSafeOperationConfirmations(
      SAFE_OPERATION_HASH,
      { offset: 1 }
    )
    chai.expect(safeOpConfirmations.count).to.be.equal(2)
    chai
      .expect(safeOpConfirmations.results)
      .to.deep.equal([EXPECTED_SAFE_OPERATION_CONFIRMATIONS[1]])
  })
})
