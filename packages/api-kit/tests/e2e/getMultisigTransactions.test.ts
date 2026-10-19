import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getMultisigTransactions', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should return an empty list if there are no multisig transactions', async () => {
    const safeAddress = '0x513697456eDb113aDCAA1bbDA5bE59D9D7A2efd1' // Safe without multisig transactions
    const safeMultisigTransactionListResponse =
      await safeApiKit.getMultisigTransactions(safeAddress)
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(0)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of multisig transactions', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions
    const { count, results } = await safeApiKit.getMultisigTransactions(safeAddress)
    chai.expect(count).to.be.greaterThanOrEqual(10)
    chai.expect(results.length).to.be.equal(Math.min(count, 50))
    results.map((transaction) => {
      chai.expect(transaction.safe.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
      chai.expect(transaction.chainId).to.be.equal(config.CHAIN_ID.toString())
    })
  })

  it('should return the list of multisig transactions EIP-3770', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const { count, results } = await safeApiKit.getMultisigTransactions(eip3770SafeAddress)
    chai.expect(count).to.be.greaterThanOrEqual(10)
    chai.expect(results.length).to.be.equal(Math.min(count, 50))
    results.map((transaction) => {
      chai.expect(transaction.safe.toLowerCase()).to.be.equal(safeAddress.toLowerCase())
    })
  })

  it('should filter the executed transactions and order them by nonce', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with multisig transactions
    const { results } = await safeApiKit.getMultisigTransactions(safeAddress, {
      executed: true,
      nonceOrder: 'asc',
      limit: 3
    })
    chai.expect(results.length).to.be.lessThanOrEqual(3)
    results.forEach((transaction) => {
      chai.expect(transaction.txHash).to.be.a('string')
    })
    const nonces = results.map((transaction) => BigInt(transaction.nonce))
    chai.expect([...nonces].sort((a, b) => (a < b ? -1 : 1))).to.deep.equal(nonces)
  })
})
