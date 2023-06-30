import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getIncomingTransactions', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(safeApiKit.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no incoming transactions', async () => {
    const safeAddress = '0x3e04a375aC5847C690A7f2fF54b45c59f7eeD6f0' // Safe without incoming transactions
    const transferListResponse = await safeApiKit.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(0)
    chai.expect(transferListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of incoming transactions', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with incoming transactions
    const transferListResponse = await safeApiKit.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(5)
    chai.expect(transferListResponse.results.length).to.be.equal(5)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })

  it('should return the list of incoming transactions EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with incoming transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transferListResponse = await safeApiKit.getIncomingTransactions(eip3770SafeAddress)
    chai.expect(transferListResponse.count).to.be.equal(5)
    chai.expect(transferListResponse.results.length).to.be.equal(5)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })
})
