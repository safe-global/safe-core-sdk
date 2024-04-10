import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getTransactionConfirmations', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should fail if safeTxHash is empty', async () => {
    const safeTxHash = ''
    await chai
      .expect(safeApiKit.getTransactionConfirmations(safeTxHash))
      .to.be.rejectedWith('Invalid safeTxHash')
  })

  it.skip('should return an empty array if the safeTxHash is not found', async () => {
    const safeTxHash = '0x'
    const transactionConfirmations = await safeApiKit.getTransactionConfirmations(safeTxHash)
    chai.expect(transactionConfirmations.count).to.be.equal(0)
    chai.expect(transactionConfirmations.results.length).to.be.equal(0)
  })

  it('should return the transaction with the given safeTxHash', async () => {
    const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480a'
    const transactionConfirmations = await safeApiKit.getTransactionConfirmations(safeTxHash)
    chai.expect(transactionConfirmations.count).to.be.equal(2)
    chai.expect(transactionConfirmations.results.length).to.be.equal(2)
  })
})
