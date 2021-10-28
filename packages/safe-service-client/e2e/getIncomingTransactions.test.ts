import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getIncomingTransactions', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getIncomingTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no incoming transactions', async () => {
    const safeAddress = '0x3e04a375aC5847C690A7f2fF54b45c59f7eeD6f0' // Safe without incoming transactions
    const transferListResponse = await serviceSdk.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(0)
    chai.expect(transferListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of incoming transactions', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD' // Safe with incoming transactions
    const transferListResponse = await serviceSdk.getIncomingTransactions(safeAddress)
    chai.expect(transferListResponse.count).to.be.equal(10)
    chai.expect(transferListResponse.results.length).to.be.equal(10)
    transferListResponse.results.map((transaction) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })
})
