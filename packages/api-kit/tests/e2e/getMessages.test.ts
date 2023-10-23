import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'

describe('getMessages', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if safeAddress is empty or invalid', async () => {
    await chai.expect(safeApiKit.getMessages('')).to.be.rejectedWith('Invalid safeAddress')
    await chai.expect(safeApiKit.getMessages('0x123')).to.be.rejectedWith('Invalid safeAddress')
  })

  it('should get the messages list', async () => {
    const messages = await safeApiKit.getMessages(safeAddress)

    chai.expect(messages).to.have.property('count').greaterThan(1)
    chai.expect(messages).to.have.property('results').to.be.an('array')
    chai.expect(messages.results[0]).to.have.property('message')
    chai.expect(messages.results[0]).to.have.property('messageHash')
    chai.expect(messages.results[0]).to.have.property('confirmations')
    chai.expect(messages.results[0]).to.have.property('safe').to.eq(safeAddress)
  })
})
