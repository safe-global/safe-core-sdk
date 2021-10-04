import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { TransferListResponse, TransferResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getIncomingTransactions', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

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

  it('should return the list of incoming transactions', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const transferListResponse: TransferListResponse = await serviceSdk.getIncomingTransactions(
      safeAddress
    )
    chai.expect(transferListResponse.count).to.be.equal(6)
    chai.expect(transferListResponse.results.length).to.be.equal(6)
    transferListResponse.results.map((transaction: TransferResponse) => {
      chai.expect(transaction.to).to.be.equal(safeAddress)
    })
  })
})
