import Safe, {
  EthSafeSignature,
  buildSignatureBytes,
  hashSafeMessage,
  buildContractSignature
} from '@safe-global/protocol-kit'
import { SafeMessage, SigningMethod } from '@safe-global/types-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getKits } from '../utils/setupKits'
import { getSafe, PRIVATE_KEY_1, PRIVATE_KEY_2, safeVersionDeployed } from '../helpers/safe'
import { describeif } from 'tests/utils/heplers'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let protocolKit: Safe

const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const generateMessage = () => `${generateRandomUUID()}: I am the owner of the safe`

const { address: safeAddress, owners, version } = getSafe()
const signerSafeAddress = owners[2]

describeif(safeVersionDeployed >= '1.4.1')(`[${version}] addMessageSignature`, () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      safeAddress,
      signer: PRIVATE_KEY_1
    }))
  })

  it('should fail if safeAddress is empty', async () => {
    await chai
      .expect(safeApiKit.addMessageSignature('', '0x'))
      .to.be.rejectedWith('Invalid messageHash or signature')
  })

  it('should fail if signature is empty', async () => {
    await chai
      .expect(safeApiKit.addMessageSignature(safeAddress, ''))
      .to.be.rejectedWith('Invalid messageHash or signature')
  })

  describe('when adding a new message', () => {
    it('should allow to add a confirmation signature using the EIP-712', async () => {
      const rawMessage: string = generateMessage()
      let safeMessage: SafeMessage = protocolKit.createMessage(rawMessage)
      safeMessage = await protocolKit.signMessage(safeMessage, 'eth_sign')

      let signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'

      await chai.expect(
        safeApiKit.addMessage(safeAddress, {
          message: rawMessage,
          signature: safeMessage.getSignature(signerAddress)?.data || '0x'
        })
      ).to.be.fulfilled

      protocolKit = await protocolKit.connect({ signer: PRIVATE_KEY_2 })
      safeMessage = await protocolKit.signMessage(safeMessage, 'eth_signTypedData_v4')

      const safeMessageHash = await protocolKit.getSafeMessageHash(hashSafeMessage(rawMessage))
      signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'

      await chai.expect(
        safeApiKit.addMessageSignature(
          safeMessageHash,
          safeMessage.getSignature(signerAddress)?.data || '0x'
        )
      ).to.be.fulfilled

      const confirmedMessage = await safeApiKit.getMessage(safeMessageHash)

      chai.expect(confirmedMessage.confirmations.length).to.eq(2)
    })

    it('should allow to add a confirmation signature using a Safe signer', async () => {
      protocolKit = await protocolKit.connect({
        signer: PRIVATE_KEY_1,
        safeAddress
      })

      const rawMessage: string = generateMessage()
      const safeMessageHash = await protocolKit.getSafeMessageHash(hashSafeMessage(rawMessage))

      let safeMessage: SafeMessage = protocolKit.createMessage(rawMessage)
      safeMessage = await protocolKit.signMessage(safeMessage, 'eth_sign')

      const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
      const ethSig = safeMessage.getSignature(signerAddress) as EthSafeSignature

      await chai.expect(
        safeApiKit.addMessage(safeAddress, {
          message: rawMessage,
          signature: buildSignatureBytes([ethSig])
        })
      ).to.be.fulfilled

      protocolKit = await protocolKit.connect({
        signer: PRIVATE_KEY_1,
        safeAddress: signerSafeAddress
      })
      let signerSafeMessage = protocolKit.createMessage(rawMessage)
      signerSafeMessage = await protocolKit.signMessage(
        signerSafeMessage,
        SigningMethod.SAFE_SIGNATURE,
        safeAddress
      )

      protocolKit = await protocolKit.connect({
        signer: PRIVATE_KEY_2,
        safeAddress: signerSafeAddress
      })
      signerSafeMessage = await protocolKit.signMessage(
        signerSafeMessage,
        SigningMethod.SAFE_SIGNATURE,
        safeAddress
      )

      const signerSafeSig = await buildContractSignature(
        Array.from(signerSafeMessage.signatures.values()),
        signerSafeAddress
      )

      protocolKit = await protocolKit.connect({
        signer: PRIVATE_KEY_1,
        safeAddress
      })

      const signature = buildSignatureBytes([signerSafeSig, ethSig])

      const isValidSignature = await protocolKit.isValidSignature(
        hashSafeMessage(rawMessage),
        signature
      )

      chai.expect(isValidSignature).to.be.true

      const contractSig = buildSignatureBytes([signerSafeSig])

      await chai.expect(safeApiKit.addMessageSignature(safeMessageHash, contractSig)).to.be
        .fulfilled

      const confirmedMessage = await safeApiKit.getMessage(safeMessageHash)
      chai.expect(confirmedMessage.confirmations.length).to.eq(2)
    })
  })
})
