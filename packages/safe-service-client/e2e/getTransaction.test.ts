import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getTransaction', () => {
  const serviceSdk = new SafeServiceClient(config.BASE_URL)

  it('should fail if safeTxHash is empty', async () => {
    const safeTxHash = ''
    await chai
      .expect(serviceSdk.getTransaction(safeTxHash))
      .to.be.rejectedWith('Invalid safeTxHash')
  })

  it('should fail if safeTxHash is not found', async () => {
    const safeTxHash = '0x'
    await chai.expect(serviceSdk.getTransaction(safeTxHash)).to.be.rejectedWith('Not found.')
  })

  it('should return the transaction with the given safeTxHash', async () => {
    const safeTxHash = '0xb22be4e57718560c89de96acd1acefe55c2673b31a7019a374ebb1d8a2842f5d'
    const transaction = await serviceSdk.getTransaction(safeTxHash)
    chai.expect(transaction.safeTxHash).to.be.equal(safeTxHash)
  })
})
