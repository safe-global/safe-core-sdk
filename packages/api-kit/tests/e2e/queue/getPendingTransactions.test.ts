import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getPendingTransactions', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if safeAddress is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.queue.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return an empty list if there are no pending transactions', async () => {
    const safeAddress = '0x513697456eDb113aDCAA1bbDA5bE59D9D7A2efd1' // Safe without pending transactions
    const transactionList = await safeApiKit.queue.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(0)
    chai.expect(transactionList.results.length).to.be.equal(0)
  })

  it('should return the the transaction list', async () => {
    const safeAddress = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transaction
    const transactionList = await safeApiKit.queue.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(10)
    chai.expect(transactionList.results.length).to.be.equal(10)
    transactionList.results.forEach((transaction) => {
      chai.expect(transaction.txHash).to.be.null
      chai.expect(transaction.safe.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    })
  })

  it('should return the the transaction list EIP-3770', async () => {
    const safeAddress = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transaction
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transactionList = await safeApiKit.queue.getPendingTransactions(eip3770SafeAddress)
    chai.expect(transactionList.count).to.be.equal(10)
    chai.expect(transactionList.results.length).to.be.equal(10)
  })

  it('should return a maximum of 2 transactions with limit = 2', async () => {
    const safeAddress = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transaction
    const transactionList = await safeApiKit.queue.getPendingTransactions(safeAddress, {
      limit: 2
    })

    chai.expect(transactionList).to.have.property('count').greaterThan(1)
    chai.expect(transactionList).to.have.property('results').to.be.an('array')
    chai.expect(transactionList.results.length).to.be.equal(2)
  })

  it('should return all pending transactions excluding the first one with offset = 1', async () => {
    const safeAddress = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transaction
    const transactionList = await safeApiKit.queue.getPendingTransactions(safeAddress, {
      offset: 1
    })

    chai.expect(transactionList).to.have.property('count').greaterThan(1)
    chai.expect(transactionList).to.have.property('results').to.be.an('array')
    chai.expect(transactionList.results.length).to.be.lessThanOrEqual(transactionList.count - 1)
  })

  it('should order the transactions by descending nonce with nonceOrder = desc', async () => {
    const safeAddress = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transaction
    const { results } = await safeApiKit.queue.getPendingTransactions(safeAddress, {
      nonceOrder: 'desc'
    })

    const nonces = results.map((transaction) => BigInt(transaction.nonce))
    chai.expect([...nonces].sort((a, b) => (a > b ? -1 : 1))).to.deep.equal(nonces)
  })
})
