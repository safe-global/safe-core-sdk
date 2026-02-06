import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getKits } from '../utils/setupKits'
import { getSafe, PRIVATE_KEY_1 as PRIVATE_KEY, safeVersionDeployed } from 'tests/helpers/safe'
import { describeif } from 'tests/utils/heplers'

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
describeif(safeVersionDeployed >= '1.4.1')(`[${version}] addMessage`, () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      safeAddress,
      signer: PRIVATE_KEY
    }))
  })

  it('should fail if safeAddress is empty or invalid', async () => {
    await chai
      .expect(
        safeApiKit.addMessage('', {
          message: generateMessage(),
          signature: '0x'
        })
      )
      .to.be.rejectedWith('Invalid safeAddress')
    await chai
      .expect(
        safeApiKit.addMessage('0x123', {
          message: generateMessage(),
          signature: '0x'
        })
      )
      .to.be.rejectedWith('Invalid safeAddress')
  })

  it('should allow to create a new off-chain message signed with EIP-191', async () => {
    const rawMessage = generateMessage()
    const safeMessage = protocolKit.createMessage(rawMessage)
    const signedMessage = await protocolKit.signMessage(safeMessage, 'eth_sign')

    await chai.expect(
      safeApiKit.addMessage(safeAddress, {
        message: rawMessage,
        signature: signedMessage.encodedSignatures()
      })
    ).to.be.fulfilled
  })

  it('should allow to create a new off-chain message signed with EIP-712', async () => {
    const rawMessage = generateMessage()
    const safeMessage = protocolKit.createMessage(rawMessage)
    const signedMessage = await protocolKit.signMessage(safeMessage, 'eth_signTypedData_v4')

    await chai.expect(
      safeApiKit.addMessage(safeAddress, {
        message: rawMessage,
        safeAppId: 123,
        signature: signedMessage.encodedSignatures()
      })
    ).to.be.fulfilled
  })
})
