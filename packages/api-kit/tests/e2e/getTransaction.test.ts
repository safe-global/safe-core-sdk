import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getTransaction', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if safeTxHash is empty', async () => {
    const safeTxHash = ''
    await chai
      .expect(safeApiKit.getTransaction(safeTxHash))
      .to.be.rejectedWith('Invalid safeTxHash')
  })

  it('should fail if safeTxHash is not found', async () => {
    const safeTxHash = '0x'
    await chai.expect(safeApiKit.getTransaction(safeTxHash)).to.be.rejectedWith('Not found.')
  })

  it('should return the transaction with the given safeTxHash', async () => {
    const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480a'
    const transaction = await safeApiKit.getTransaction(safeTxHash)
    chai.expect(transaction.safeTxHash).to.be.equal(safeTxHash)
    chai.expect(transaction.safe).to.be.eq(API_TESTING_SAFE.address)
    chai.expect(transaction.nonce).to.be.a('number')
    chai.expect(transaction.safeTxGas).to.be.a('number')
    chai.expect(transaction.baseGas).to.be.a('number')
  })
})
