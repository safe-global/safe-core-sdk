import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'
import { getSafe } from 'tests/helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
const safeAddress = getSafe().address

describe('getMessage', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  it('should fail if messageHash is empty', async () => {
    await chai.expect(safeApiKit.getMessage('')).to.be.rejectedWith('Invalid messageHash')
  })

  it('should fail if the message does not exist', async () => {
    const messageHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480b'
    await chai.expect(safeApiKit.getMessage(messageHash)).to.be.rejected
  })

  it('should get the message given a message hash', async () => {
    const messages = await safeApiKit.getMessages(safeAddress)
    const messageHash = messages.results[0].messageHash
    const message = await safeApiKit.getMessage(messageHash)

    chai.expect(message).to.deep.eq(messages.results[0])
  })
})
