import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getIncomingTransactions', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = API_TESTING_SAFE.address.toLowerCase()
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
    const safeAddress = API_TESTING_SAFE.address // Safe with incoming transactions
    const transferListResponse = await safeApiKit.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(6)
    chai.expect(transferListResponse.results.length).to.be.equal(6)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
      chai.expect(transaction).to.have.property('from').to.be.a('string')
      chai.expect(transaction).to.have.property('executionDate').to.be.a('string')
      chai.expect(transaction).to.have.property('blockNumber').to.be.a('number')
      chai.expect(transaction).to.have.property('transactionHash').to.be.a('string')
      chai.expect(transaction).to.have.property('transferId').to.be.a('string')
      if (transaction.type === 'ETHER_TRANSFER') {
        chai.expect(transaction.value).to.not.be.null
        chai.expect(transaction.tokenId).to.be.null
        chai.expect(transaction.tokenAddress).to.be.null
        chai.expect(transaction.tokenInfo).to.be.null
      } else if (transaction.type === 'ERC20_TRANSFER') {
        chai.expect(transaction.tokenId).to.not.be.null
        chai.expect(transaction.tokenAddress).to.not.be.null
        chai.expect(transaction.tokenInfo).to.not.be.null
      }
    })
  })

  it('should return the list of incoming transactions EIP-3770', async () => {
    const safeAddress = API_TESTING_SAFE.address // Safe with incoming transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transferListResponse = await safeApiKit.getIncomingTransactions(eip3770SafeAddress)
    chai.expect(transferListResponse.count).to.be.equal(6)
    chai.expect(transferListResponse.results.length).to.be.equal(6)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
      chai.expect(transaction).to.have.property('from').to.be.a('string')
      chai.expect(transaction).to.have.property('executionDate').to.be.a('string')
      chai.expect(transaction).to.have.property('blockNumber').to.be.a('number')
      chai.expect(transaction).to.have.property('transactionHash').to.be.a('string')
      chai.expect(transaction).to.have.property('transferId').to.be.a('string')
      if (transaction.type === 'ETHER_TRANSFER') {
        chai.expect(transaction.value).to.not.be.null
        chai.expect(transaction.tokenId).to.be.null
        chai.expect(transaction.tokenAddress).to.be.null
        chai.expect(transaction.tokenInfo).to.be.null
      } else if (transaction.type === 'ERC20_TRANSFER') {
        chai.expect(transaction.tokenId).to.not.be.null
        chai.expect(transaction.tokenAddress).to.not.be.null
        chai.expect(transaction.tokenInfo).to.not.be.null
      }
    })
  })
})
