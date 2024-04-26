import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // v1.4.1
const SIGNER_PK = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

let safeApiKit: SafeApiKit

describe('getSafeOperation', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(SIGNER_PK, TX_SERVICE_URL))
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
    const safeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    const safeOperationHash = safeOperations.results[0].safeOperationHash

    const safeOperation = await safeApiKit.getSafeOperation(safeOperationHash)

    chai.expect(safeOperation).to.deep.eq(safeOperations.results[0])
  })
})
