import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getPendingTransactions', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if safeAddress is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if safeAddress is not checksummed', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'.toLowerCase()
    await chai
      .expect(safeApiKit.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no pending transactions', async () => {
    const safeAddress = '0xDa8dd250065F19f7A29564396D7F13230b9fC5A3' // Safe without pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(0)
    chai.expect(transactionList.results.length).to.be.equal(0)
  })

  it('should return the the transaction list', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(10)
    chai.expect(transactionList.results.length).to.be.equal(10)
  })

  it('should return the the transaction list EIP-3770', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with pending transaction
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transactionList = await safeApiKit.getPendingTransactions(eip3770SafeAddress)
    chai.expect(transactionList.count).to.be.equal(10)
    chai.expect(transactionList.results.length).to.be.equal(10)
  })

  it('should return a maximum of 2 transactions with limit = 2', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress, {
      limit: 2
    })

    chai.expect(transactionList).to.have.property('count').greaterThan(1)
    chai.expect(transactionList).to.have.property('results').to.be.an('array')
    chai.expect(transactionList.results.length).to.be.equal(2)
  })

  it('should return all pending transactions excluding the first one with offset = 1', async () => {
    const safeAddress = '0xCa2f5A815b642c79FC530B60BC15Aee4eF6252b3' // Safe with pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress, {
      offset: 1
    })

    chai.expect(transactionList).to.have.property('count').greaterThan(1)
    chai.expect(transactionList).to.have.property('results').to.be.an('array')
    chai.expect(transactionList.results.length).to.be.lessThanOrEqual(transactionList.count - 1)
  })
})
