import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'
import { API_TESTING_SAFE } from '../helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
const safeAddress = API_TESTING_SAFE.address

describe('getMessage', () => {
  before(async () => {
    safeApiKit = getApiKit()
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
