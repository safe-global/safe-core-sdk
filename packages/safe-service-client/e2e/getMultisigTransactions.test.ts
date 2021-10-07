import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getMultisigTransactions', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no multisig transactions', async () => {
    const safeAddress = '0x3e04a375aC5847C690A7f2fF54b45c59f7eeD6f0' // Safe without multisig transactions
    const safeMultisigTransactionListResponse = await serviceSdk.getMultisigTransactions(
      safeAddress
    )
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(0)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of multisig transactions', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD' // Safe with multisig transactions
    const safeMultisigTransactionListResponse = await serviceSdk.getMultisigTransactions(
      safeAddress
    )
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(11)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(11)
    safeMultisigTransactionListResponse.results.map((transaction) => {
      chai.expect(transaction.safe).to.be.equal(safeAddress)
    })
  })
})
