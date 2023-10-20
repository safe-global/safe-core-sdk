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
const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'

describe('addMessage', () => {
  before(async () => {
    ;({ safeApiKit, ethAdapter } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))

    protocolKit = await Safe.create({
      ethAdapter,
      safeAddress
    })
  })

  it('should fail if safeAddress is empty', async () => {
    await chai
      .expect(
        safeApiKit.addMessage('', {
          message: generateMessage(),
          signature: '0x'
        })
      )
      .to.be.rejectedWith('Invalid safeAddress')
  })

  it('should allow to add an offchain message with EIP-191', async () => {
    const rawMessage = generateMessage()
    const messageHash = await protocolKit.getHash(rawMessage)
    const safeMessageHash = await protocolKit.getSafeMessageHash(messageHash)
    const signature = await protocolKit.signHash(safeMessageHash)

    await chai.expect(
      safeApiKit.addMessage('0x9D1E7371852a9baF631Ea115b9815deb97cC3205', {
        message: rawMessage,
        signature: signature.data
      })
    ).to.be.fulfilled
  })

  it('should allow to add an offchain message with EIP-712', async () => {
    const rawMessage = generateMessage()
    const signature = await protocolKit.signTypedData(rawMessage)

    await chai.expect(
      safeApiKit.addMessage('0x9D1E7371852a9baF631Ea115b9815deb97cC3205', {
        message: rawMessage,
        signature: signature.data
      })
    ).to.be.fulfilled
  })
})
