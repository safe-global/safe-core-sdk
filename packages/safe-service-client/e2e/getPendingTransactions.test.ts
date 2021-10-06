import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeMultisigTransactionListResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getPendingTransactions', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if safeAddress is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if safeAddress is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getPendingTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the transaction with the given safeAddress', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const transactionList: SafeMultisigTransactionListResponse =
      await serviceSdk.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(0)
    chai.expect(transactionList.results.length).to.be.equal(0)
  })
})
