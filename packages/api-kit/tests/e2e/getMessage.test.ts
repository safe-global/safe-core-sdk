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

  it('should fail if safeAddress is empty', async () => {
    await chai.expect(safeApiKit.getMessage('')).to.be.rejectedWith('Invalid messageHash')
  })

  it('should get the message given a message hash', async () => {
    const messages = await safeApiKit.getMessages(safeAddress)
    const messageHash = messages.results[0].messageHash
    const message = await safeApiKit.getMessage(messageHash)

    chai.expect(message).to.deep.eq(messages.results[0])
  })
})
