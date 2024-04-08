import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'

describe('getMessages', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
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
