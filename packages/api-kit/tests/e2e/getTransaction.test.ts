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
    const safeTxHash = '0x6eb95c6264c3fe1416e41c21d9bd6d084ffe596c7d04c945eb20cde637274503'
    const transaction = await safeApiKit.getTransaction(safeTxHash)
    chai.expect(transaction.safeTxHash).to.be.equal(safeTxHash)
    chai.expect(transaction.safe).to.be.eq(API_TESTING_SAFE.address)
    chai.expect(transaction.nonce).to.be.a('string')
    chai.expect(transaction.safeTxGas).to.be.a('string')
    chai.expect(transaction.baseGas).to.be.a('string')
  })
})
