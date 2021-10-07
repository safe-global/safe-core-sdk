import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getTransactionConfirmations', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if safeTxHash is empty', async () => {
    const safeTxHash = ''
    await chai
      .expect(serviceSdk.getTransactionConfirmations(safeTxHash))
      .to.be.rejectedWith('Invalid safeTxHash')
  })

  it('should return an empty array if the safeTxHash is not found', async () => {
    const safeTxHash = '0x'
    const transactionConfirmations = await serviceSdk.getTransactionConfirmations(safeTxHash)
    chai.expect(transactionConfirmations.count).to.be.equal(0)
    chai.expect(transactionConfirmations.results.length).to.be.equal(0)
  })

  it('should return the transaction with the given safeTxHash', async () => {
    const safeTxHash = '0xb22be4e57718560c89de96acd1acefe55c2673b31a7019a374ebb1d8a2842f5d'
    const transactionConfirmations = await serviceSdk.getTransactionConfirmations(safeTxHash)
    chai.expect(transactionConfirmations.count).to.be.equal(2)
    chai.expect(transactionConfirmations.results.length).to.be.equal(2)
  })
})
