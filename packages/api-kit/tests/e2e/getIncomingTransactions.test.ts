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
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'.toLowerCase()
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
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78' // Safe with incoming transactions
    const transferListResponse = await safeApiKit.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(6)
    chai.expect(transferListResponse.results.length).to.be.equal(6)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })

  it('should return the list of incoming transactions EIP-3770', async () => {
    const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78' // Safe with incoming transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const transferListResponse = await safeApiKit.getIncomingTransactions(eip3770SafeAddress)
    chai.expect(transferListResponse.count).to.be.equal(6)
    chai.expect(transferListResponse.results.length).to.be.equal(6)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })
})
