import Safe, { hashSafeMessage } from '@safe-global/protocol-kit'
import { EthAdapter, SafeMessage } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit1: SafeApiKit
let ethAdapter1: EthAdapter
let protocolKit1: Safe
let ethAdapter2: EthAdapter
let protocolKit2: Safe

const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateMessage = () => `${generateRandomUUID()}: I am the owner of the safe`
const safeAddress = '0x3296b3DD454B7c3912F7F477787B503918C50082'

describe('addMessageSignature', () => {
  before(async () => {
    ;({ safeApiKit: safeApiKit1, ethAdapter: ethAdapter1 } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
    ;({ ethAdapter: ethAdapter2 } = await getServiceClient(
      '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1'
    ))

    protocolKit1 = await Safe.create({
      ethAdapter: ethAdapter1,
      safeAddress
    })

    protocolKit2 = await Safe.create({
      ethAdapter: ethAdapter2,
      safeAddress
    })
  })

  it('should fail if safeAddress is empty', async () => {
    await chai
      .expect(safeApiKit1.addMessageSignature('', '0x'))
      .to.be.rejectedWith('Invalid messageHash or signature')
  })

  it('should fail if signature is empty', async () => {
    await chai
      .expect(safeApiKit1.addMessageSignature(safeAddress, ''))
      .to.be.rejectedWith('Invalid messageHash or signature')
  })

  it('should allow to add a confirmation signature using a mix of EIP-191 and EIP-712', async () => {
    const rawMessage = generateMessage()
    const safeMessage = protocolKit1.createMessage(rawMessage)
    const signedMessage1: SafeMessage = await protocolKit1.signMessage(safeMessage, 'eth_sign')

    await chai.expect(
      safeApiKit1.addMessage(safeAddress, {
        message: rawMessage,
        signature: [...signedMessage1.signatures.values()][0].data
      })
    ).to.be.fulfilled

    const signedMessage2 = await protocolKit2.signMessage(signedMessage1, 'eth_signTypedData_v4')

    const safeMessageHash = await protocolKit1.getSafeMessageHash(hashSafeMessage(rawMessage))

    await chai.expect(
      safeApiKit1.addMessageSignature(
        safeMessageHash,
        [...signedMessage2.signatures.values()][1].data
      )
    ).to.be.fulfilled

    const confirmedMessage = await safeApiKit1.getMessage(safeMessageHash)

    chai.expect(confirmedMessage.confirmations.length).to.eq(2)
  })
})
