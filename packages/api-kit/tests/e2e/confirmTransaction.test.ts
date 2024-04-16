import Safe, {
  EthSafeSignature,
  buildSignatureBytes,
  SigningMethod,
  buildContractSignature
} from '@safe-global/protocol-kit'
import { Eip1193Provider, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit1: SafeApiKit
let protocolKit: Safe
let provider1: Eip1193Provider
let provider2: Eip1193Provider

const safeAddress = '0x3296b3DD454B7c3912F7F477787B503918C50082'
const signerSafeAddress = '0x83aB93f078A8fbbe6a677b1C488819e0ae981128'

describe('proposeTransaction', () => {
  before(async () => {
    ;({ safeApiKit: safeApiKit1, provider: provider1 } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      'https://safe-transaction-goerli.staging.5afe.dev/api'
    ))
    ;({ provider: provider2 } = await getServiceClient(
      '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      'https://safe-transaction-goerli.staging.5afe.dev/api'
    ))
  })

  beforeEach(async () => {
    protocolKit = await Safe.create({
      provider: provider1,
      safeAddress
    })
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

    const signerAddress = (await provider1.getSignerAddress()) || '0x'
    const ethSig = tx.getSignature(signerAddress) as EthSafeSignature

    const txOptions = {
      safeAddress,
      safeTransactionData: tx.data,
      safeTxHash: txHash,
      senderAddress: signerAddress,
      senderSignature: buildSignatureBytes([ethSig])
    }

    await chai.expect(safeApiKit1.proposeTransaction(txOptions)).to.be.fulfilled

    // Signer Safe signature
    protocolKit = await protocolKit.connect({
      provider: provider1,
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
      provider: provider2,
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
      provider: provider1,
      safeAddress
    })

    const isValidSignature = await protocolKit.isValidSignature(txHash, [ethSig, signerSafeSig])
    console.log('- isValidSignature(txHash, signature) = ', isValidSignature)
    // chai.expect(isValidSignature).to.be.true

    const contractSig = buildSignatureBytes([signerSafeSig])
    await chai.expect(safeApiKit1.confirmTransaction(txHash, contractSig)).to.be.fulfilled

    const confirmedMessage = await safeApiKit1.getTransaction(txHash)
    chai.expect(confirmedMessage.confirmations.length).to.eq(2)
  })
})
