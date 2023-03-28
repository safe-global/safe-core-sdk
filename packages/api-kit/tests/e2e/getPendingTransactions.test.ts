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
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if safeAddress is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if safeAddress is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(safeApiKit.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no pending transactions', async () => {
    const safeAddress = '0x72c346260a4887F0231af41178C1c818Ce34543f' // Safe without pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(0)
    chai.expect(transactionList.results.length).to.be.equal(0)
  })

  it('should return the the transaction list', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with pending transaction
    const transactionList = await safeApiKit.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(1)
    chai.expect(transactionList.results.length).to.be.equal(1)
  })

  it('should return the the transaction list EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with pending transaction
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transactionList = await safeApiKit.getPendingTransactions(eip3770SafeAddress)
    chai.expect(transactionList.count).to.be.equal(1)
    chai.expect(transactionList.results.length).to.be.equal(1)
  })
})
