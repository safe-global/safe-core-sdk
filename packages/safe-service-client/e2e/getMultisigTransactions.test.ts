import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, {
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse
} from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getMultisigTransactions', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

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

  it('should return the list of multisig transactions', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const safeMultisigTransactionListResponse: SafeMultisigTransactionListResponse =
      await serviceSdk.getMultisigTransactions(safeAddress)
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(3)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(3)
    safeMultisigTransactionListResponse.results.map(
      (transaction: SafeMultisigTransactionResponse) => {
        chai.expect(transaction.safe).to.be.equal(safeAddress)
      }
    )
  })
})
