import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getKits } from '../../utils/setupKits'
import { getSafe, PRIVATE_KEY_1 as PRIVATE_KEY, safeVersionDeployed } from 'tests/helpers/safe'
import { describeif } from 'tests/utils/helpers'
import semverSatisfies from 'semver/functions/satisfies.js'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let protocolKit: Safe

const { address: safeAddress, version } = getSafe()

const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateMessage = () => `${generateRandomUUID()}: I am the owner of the safe`
describeif(semverSatisfies(safeVersionDeployed, '>=1.4.1'))(`[${version}] addMessage`, () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      safeAddress,
      signer: PRIVATE_KEY
    }))
  })

  it('should fail if safeAddress is empty or invalid', async () => {
    await chai
      .expect(
        safeApiKit.queue.addMessage('', {
          message: generateMessage(),
          signatures: '0x1234'
        })
      )
      .to.be.rejectedWith('Invalid Safe address')
    await chai
      .expect(
        safeApiKit.queue.addMessage('0x123', {
          message: generateMessage(),
          signatures: '0x1234'
        })
      )
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should allow to create a new off-chain message signed with EIP-191', async () => {
    const rawMessage = generateMessage()
    const safeMessage = protocolKit.createMessage(rawMessage)
    const signedMessage = await protocolKit.signMessage(safeMessage, 'eth_sign')

    const messageResponse = await safeApiKit.queue.addMessage(safeAddress, {
      message: rawMessage,
      signatures: signedMessage.encodedSignatures()
    })

    chai.expect(messageResponse.message).to.eq(rawMessage)
    chai.expect(messageResponse.safe.toLowerCase()).to.eq(safeAddress.toLowerCase())
    chai.expect(messageResponse.messageHash).to.be.a('string')
    chai.expect(messageResponse.confirmations.length).to.eq(1)
  })

  it('should allow to create a new off-chain message signed with EIP-712', async () => {
    const rawMessage = generateMessage()
    const safeMessage = protocolKit.createMessage(rawMessage)
    const signedMessage = await protocolKit.signMessage(safeMessage, 'eth_signTypedData_v4')

    const messageResponse = await safeApiKit.queue.addMessage(safeAddress, {
      message: rawMessage,
      originName: 'Safe Core SDK',
      originUrl: 'https://safe.global',
      signatures: signedMessage.encodedSignatures()
    })

    chai.expect(messageResponse.originName).to.eq('Safe Core SDK')
    chai.expect(messageResponse.originUrl).to.eq('https://safe.global')
    chai.expect(messageResponse.confirmations.length).to.eq(1)
  })
})
