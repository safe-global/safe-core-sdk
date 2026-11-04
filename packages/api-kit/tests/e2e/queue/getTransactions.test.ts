import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

const safeAddress1 = '0x95eF108E0dcC050c129fbBEB0456D1121c98A59c' // Safe with pending transactions
const safeAddress2 = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions

describe('queue.getTransactions', () => {
  before(() => {
    safeApiKit = getApiKit()
  })

  it('should fail without Safes', async () => {
    await chai
      .expect(safeApiKit.queue.getTransactions({ safes: [] }))
      .to.be.rejectedWith('At least one Safe is required')
  })

  it('should merge the transactions of several Safes', async () => {
    const { count: count1 } = await safeApiKit.queue.getSafeTransactions(safeAddress1)
    const { count: count2 } = await safeApiKit.queue.getSafeTransactions(safeAddress2)
    const { count, results } = await safeApiKit.queue.getTransactions({
      safes: [
        { address: safeAddress1, chainIds: [config.CHAIN_ID] },
        { address: safeAddress2, chainIds: [config.CHAIN_ID] }
      ]
    })

    chai.expect(count).to.be.equal(count1 + count2)
    results.forEach((transaction) => {
      chai
        .expect([safeAddress1.toLowerCase(), safeAddress2.toLowerCase()])
        .to.include(transaction.safe.toLowerCase())
    })
  })

  it('should filter the executed transactions and paginate', async () => {
    const { results } = await safeApiKit.queue.getTransactions({
      safes: [safeAddress2],
      executed: true,
      nonceOrder: 'asc',
      limit: 2
    })
    chai.expect(results.length).to.be.lessThanOrEqual(2)
    results.forEach((transaction) => chai.expect(transaction.txHash).to.be.a('string'))
  })
})

describe('queue.getTransactionsBatch', () => {
  before(() => {
    safeApiKit = getApiKit()
  })

  it('should fail without hashes', async () => {
    await chai
      .expect(safeApiKit.queue.getTransactionsBatch([]))
      .to.be.rejectedWith('At least one safeTxHash is required')
  })

  it('should return the transactions of the given hashes, skipping the unknown ones', async () => {
    const { results } = await safeApiKit.queue.getSafeTransactions(safeAddress2, { limit: 2 })
    const hashes = results.map((transaction) => transaction.safeTxHash)
    const unknownHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480b'

    const transactions = await safeApiKit.queue.getTransactionsBatch([...hashes, unknownHash])

    chai.expect(transactions.length).to.be.equal(hashes.length)
    chai
      .expect(transactions.map((transaction) => transaction.safeTxHash).sort())
      .to.deep.equal([...hashes].sort())
  })
})
