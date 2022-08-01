import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient from '../../src'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let serviceSdk: SafeServiceClient

describe('getTransaction', () => {
  before(async () => {
    ;({ serviceSdk } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

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
    const safeTxHash = '0xc58b604550610302477087256063d1ba195fbec20b2fd27648fec55242074592'
    const transaction = await serviceSdk.getTransaction(safeTxHash)
    chai.expect(transaction.safeTxHash).to.be.equal(safeTxHash)
  })
})
