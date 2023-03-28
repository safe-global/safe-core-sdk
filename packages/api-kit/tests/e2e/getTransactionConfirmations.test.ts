import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getTransactionConfirmations', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
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
    const safeTxHash = '0xc58b604550610302477087256063d1ba195fbec20b2fd27648fec55242074592'
    const transactionConfirmations = await safeApiKit.getTransactionConfirmations(safeTxHash)
    chai.expect(transactionConfirmations.count).to.be.equal(2)
    chai.expect(transactionConfirmations.results.length).to.be.equal(2)
  })
})
