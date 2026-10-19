import Safe, {
  EthSafeSignature,
  buildSignatureBytes,
  buildContractSignature
} from '@safe-global/protocol-kit'
import {
  SafeMultisigConfirmationResponse,
  SafeTransactionDataPartial,
  SigningMethod
} from '@safe-global/types-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { toBytes, toHex } from 'viem'
import { getKits } from '../utils/setupKits'
import { getSafe, PRIVATE_KEY_1, PRIVATE_KEY_2 } from 'tests/helpers/safe'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit
let protocolKit: Safe

const safeInfo = getSafe()
const safeAddress = safeInfo.address
const signerSafeAddress = safeInfo.owners[2]

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
      senderSignature: buildSignatureBytes([ethSig])
    }

    const proposedTransaction = await safeApiKit.proposeTransaction(txOptions)
    chai.expect(proposedTransaction.safeTxHash).to.eq(txHash)
    chai.expect(proposedTransaction.proposedVia).to.eq('OWNER')
    chai.expect(proposedTransaction.proposer?.toLowerCase()).to.eq(signerAddress.toLowerCase())
    chai.expect(proposedTransaction.confirmations.length).to.eq(1)

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

    const addedConfirmations = await safeApiKit.confirmTransaction(txHash, contractSig)
    chai.expect(addedConfirmations.length).to.eq(1)
    chai.expect(addedConfirmations[0].safeTxHash).to.eq(txHash)
    chai.expect(addedConfirmations[0].owner.toLowerCase()).to.eq(signerSafeAddress.toLowerCase())

    const confirmedTransaction = await safeApiKit.getTransaction(txHash)

    chai.expect(confirmedTransaction.confirmations.length).to.eq(2)

    // The order of the confirmations is not guaranteed
    const findConfirmation = (owner: string) =>
      confirmedTransaction.confirmations.find(
        (confirmation) => confirmation.owner.toLowerCase() === owner.toLowerCase()
      ) as SafeMultisigConfirmationResponse
    const eoaConfirmation = findConfirmation(signerAddress)
    const contractConfirmation = findConfirmation(signerSafeAddress)

    // Check that the creation date is within the last minute
    chai.expect(Date.now() - new Date(eoaConfirmation.created).valueOf()).lte(60000)
    chai.expect(Date.now() - new Date(contractConfirmation.created).valueOf()).lte(60000)

    chai.expect(eoaConfirmation.signature.toLowerCase()).to.eq(ethSig.data.toLowerCase())
    chai.expect(eoaConfirmation.signatureType).to.eq('EOA')
    chai.expect(contractConfirmation.signature.toLowerCase()).to.eq(contractSig.toLowerCase())
    chai.expect(contractConfirmation.signatureType).to.eq('CONTRACT_SIGNATURE')
  })
})
