import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'

describe('getMessages', () => {
  before(async () => {
    safeApiKit = getApiKit()
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

  it('should return a maximum of 5 messages with limit = 5', async () => {
    const messages = await safeApiKit.getMessages(safeAddress, { limit: 5 })

    chai.expect(messages).to.have.property('count').greaterThan(1)
    chai.expect(messages).to.have.property('results').to.be.an('array')
    chai.expect(messages.results.length).to.be.lessThanOrEqual(5)
  })

  it('should return all messages excluding the first one with offset = 1', async () => {
    const messages = await safeApiKit.getMessages(safeAddress, { offset: 1 })

    chai.expect(messages).to.have.property('count').greaterThan(1)
    chai.expect(messages).to.have.property('results').to.be.an('array')
    chai.expect(messages.results.length).to.be.lessThanOrEqual(messages.count - 1)
  })
})
