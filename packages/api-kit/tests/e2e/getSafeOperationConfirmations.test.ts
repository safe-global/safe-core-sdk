import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'
const SAFE_OPERATION_HASH = '0x375d3bd580600ce04d7d2c1d8d88d85f27b9c7d14d7b544f2ee585d672f2b449'
const EXPECTED_SAFE_OPERATION_CONFIRMATIONS = [
  {
    created: '2024-06-19T10:45:22.906337Z',
    modified: '2024-06-19T10:45:22.906337Z',
    owner: '0x56e2C102c664De6DfD7315d12c0178b61D16F171',
    signature:
      '0x3c4a706f78e269e20e046f06a153ff06842045bf2c9e7b28aa9f4e93b530c8aa67b8c0871ae008987ad9d1abbe1aa48efbae3b425c791ba03ed1a7542e07c9ce1b',
    signatureType: 'EOA'
  },
  {
    created: '2024-06-19T10:45:25.895780Z',
    modified: '2024-06-19T10:45:25.895780Z',
    owner: '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B',
    signature:
      '0x619619f4f29578bc9cc4396ceb4b8ee6cc8722bc011f6cf3ace3c903b29162a07e2ddb3af4beccecd8ce68252af177a29f613d1d27c7961b0fc61cf09a0347fa1b',
    signatureType: 'EOA'
  }
]

describe('getSafeOperationConfirmations', () => {
  before(async () => {
    safeApiKit = getApiKit(TX_SERVICE_URL)
  })

  it('should fail if safeOperationHash is empty', async () => {
    await chai
      .expect(safeApiKit.getSafeOperationConfirmations(''))
      .to.be.rejectedWith('Invalid SafeOperation hash')
  })

  it('should return an empty array if the safeOperationHash is not found', async () => {
    const safeOperationHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
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
