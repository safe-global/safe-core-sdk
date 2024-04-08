import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getPendingTransactions', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
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
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78' // Safe with pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(3)
    chai.expect(transactionList.results.length).to.be.equal(3)
  })

  it('should return the the transaction list EIP-3770', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78' // Safe with pending transaction
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transactionList = await safeApiKit.getPendingTransactions(eip3770SafeAddress)
    chai.expect(transactionList.count).to.be.equal(3)
    chai.expect(transactionList.results.length).to.be.equal(3)
  })
})
