import Safe from '@safe-global/protocol-kit'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let ethAdapter: EthAdapter
let protocolKit: Safe

const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateMessage = () => `${generateRandomUUID()}: I am the owner of the safe`
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'

describe('addMessage', () => {
  before(async () => {
    ;({ safeApiKit, ethAdapter } = await getServiceClient(
      '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
    ))

    protocolKit = await Safe.create({
      ethAdapter,
      safeAddress
    })
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
