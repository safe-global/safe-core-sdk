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

  it('should return an empty list if there are no pending transactions', async () => {
    const safeAddress = '0x3e04a375aC5847C690A7f2fF54b45c59f7eeD6f0' // Safe without pending transaction
    const transactionList: SafeMultisigTransactionListResponse =
      await serviceSdk.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(0)
    chai.expect(transactionList.results.length).to.be.equal(0)
  })

  it('should return the the transaction list', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD' // Safe with pending transaction
    const transactionList: SafeMultisigTransactionListResponse =
      await serviceSdk.getPendingTransactions(safeAddress)
    chai.expect(transactionList.count).to.be.equal(2)
    chai.expect(transactionList.results.length).to.be.equal(2)
  })
})
