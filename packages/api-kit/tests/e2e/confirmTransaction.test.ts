import Safe, {
  EthSafeSignature,
  buildSignatureBytes,
  SigningMethod,
  buildContractSignature
} from '@safe-global/protocol-kit'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const PRIVATE_KEY_2 = '0xb88ad5789871315d0dab6fc5961d6714f24f35a6393f13a6f426dfecfc00ab44'

let safeApiKit: SafeApiKit
let protocolKit: Safe

const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const signerSafeAddress = '0xDa8dd250065F19f7A29564396D7F13230b9fC5A3'

describe('proposeTransaction', () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      signer: PRIVATE_KEY_1,
      safeAddress
    }))
  })

  it('should allow to create and confirm transactions signature using a Safe signer', async () => {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: safeAddress,
      value: '100000000000000000', // 0.01 ETH
      data: '0x'
    }

    let tx = await protocolKit.createTransaction({ transactions: [safeTransactionData] })
    const txHash = await protocolKit.getTransactionHash(tx)

    // EOA signature
    tx = await protocolKit.signTransaction(tx)

    const signerAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
    const ethSig = tx.getSignature(signerAddress) as EthSafeSignature

    const txOptions = {
      safeAddress,
      safeTransactionData: tx.data,
      safeTxHash: txHash,
      senderAddress: signerAddress,
      senderSignature: buildSignatureBytes([ethSig])
    }

    await chai.expect(safeApiKit.proposeTransaction(txOptions)).to.be.fulfilled

    // Signer Safe signature
    protocolKit = await protocolKit.connect({
      signer: PRIVATE_KEY_1,
      safeAddress: signerSafeAddress
    })

    let signerSafeTx = await protocolKit.createTransaction({
      transactions: [tx.data]
    })
    signerSafeTx = await protocolKit.signTransaction(
      signerSafeTx,
      SigningMethod.SAFE_SIGNATURE,
      safeAddress
    )

    protocolKit = await protocolKit.connect({
      signer: PRIVATE_KEY_2,
      safeAddress: signerSafeAddress
    })
    signerSafeTx = await protocolKit.signTransaction(
      signerSafeTx,
      SigningMethod.SAFE_SIGNATURE,
      safeAddress
    )

    const signerSafeSig = await buildContractSignature(
      Array.from(signerSafeTx.signatures.values()),
      signerSafeAddress
    )

    protocolKit = await protocolKit.connect({
      signer: PRIVATE_KEY_1,
      safeAddress
    })

    const isValidSignature = await protocolKit.isValidSignature(txHash, [ethSig, signerSafeSig])
    console.log('- isValidSignature(txHash, signature) = ', isValidSignature)
    // chai.expect(isValidSignature).to.be.true

    const contractSig = buildSignatureBytes([signerSafeSig])
    await chai.expect(safeApiKit.confirmTransaction(txHash, contractSig)).to.be.fulfilled

    const confirmedMessage = await safeApiKit.getTransaction(txHash)
    chai.expect(confirmedMessage?.confirmations?.length).to.eq(2)
  })
})
