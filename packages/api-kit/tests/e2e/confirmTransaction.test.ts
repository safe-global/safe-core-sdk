import Safe, {
  EthSafeSignature,
  buildSignatureBytes,
  SigningMethod,
  buildContractSignature
} from '@safe-global/protocol-kit'
import {
  SafeMultisigConfirmationResponse,
  SafeTransactionDataPartial
} from '@safe-global/types-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { toBytes, toHex } from 'viem'
import { getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676' // Address: 0x56e2C102c664De6DfD7315d12c0178b61D16F171
const PRIVATE_KEY_2 = '0xb88ad5789871315d0dab6fc5961d6714f24f35a6393f13a6f426dfecfc00ab44' // Address: 0x9ccbde03edd71074ea9c49e413fa9cdff16d263b

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
      value: '10000000000000000', // 0.01 ETH
      // We generate unique data from the current timestamp to receive a different tx hash each time
      data: toHex(toBytes(Date.now()))
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

    const contractSig = buildSignatureBytes([signerSafeSig])

    await chai.expect(safeApiKit.confirmTransaction(txHash, contractSig)).to.be.fulfilled

    const confirmedMessage = await safeApiKit.getTransaction(txHash)

    chai.expect(confirmedMessage.confirmations?.length).to.eq(2)

    const [confirmation1, confirmation2] = confirmedMessage!.confirmations as [
      a: SafeMultisigConfirmationResponse,
      b: SafeMultisigConfirmationResponse
    ]

    // Check that the submission date is within the last minute
    chai.expect(Date.now() - new Date(confirmation1.submissionDate).valueOf()).lte(60000)
    chai.expect(Date.now() - new Date(confirmation2.submissionDate).valueOf()).lte(60000)

    chai.expect(confirmedMessage.confirmations).to.deep.eq([
      {
        owner: signerAddress,
        submissionDate: confirmation1.submissionDate,
        transactionHash: null,
        signature: ethSig.data,
        signatureType: 'EOA'
      },
      {
        owner: signerSafeAddress,
        submissionDate: confirmation2.submissionDate,
        transactionHash: null,
        signature: contractSig.toLowerCase(),
        signatureType: 'CONTRACT_SIGNATURE'
      }
    ])
  })
})
