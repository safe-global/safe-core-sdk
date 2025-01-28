import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { BundlerClient, Safe4337InitOptions, Safe4337Pack } from '@safe-global/relay-kit'
import { generateTransferCallData } from '@safe-global/relay-kit/packs/safe-4337/testing-utils/helpers'
import SafeApiKit from '@safe-global/api-kit/index'
import { getAddSafeOperationProps } from '@safe-global/api-kit/utils/safeOperation'
import { SafeOperation } from '@safe-global/types-kit'
// Needs to be imported from dist folder in order to mock the getEip4337BundlerProvider function
import * as safe4337Utils from '@safe-global/relay-kit/dist/src/packs/safe-4337/utils'
import { getApiKit, getEip1193Provider } from '../utils/setupKits'
import {
  ENTRYPOINT_ADDRESS_V06,
  RPC_4337_CALLS
} from '@safe-global/relay-kit/packs/safe-4337/constants'

chai.use(chaiAsPromised)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const PRIVATE_KEY_2 = '0xb88ad5789871315d0dab6fc5961d6714f24f35a6393f13a6f426dfecfc00ab44'
const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // 4337 enabled 1/2 Safe (v1.4.1) owned by PRIVATE_KEY_1 + PRIVATE_KEY_2
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'
const BUNDLER_URL = `https://bundler.url`
const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

let safeApiKit: SafeApiKit
let safe4337Pack: Safe4337Pack
let safeOperation: SafeOperation
let safeOpHash: string

describe('confirmSafeOperation', () => {
  const transferUSDC = {
    to: PAYMASTER_TOKEN_ADDRESS,
    data: generateTransferCallData(SAFE_ADDRESS, 100_000n),
    value: Date.now().toString(), // Make sure that the transaction hash is unique
    operation: 0
  }

  const getSafe4337Pack = async (options: Partial<Safe4337InitOptions>) =>
    Safe4337Pack.init({
      provider: options.provider || getEip1193Provider(),
      signer: options.signer || PRIVATE_KEY_1,
      options: { safeAddress: SAFE_ADDRESS },
      bundlerUrl: BUNDLER_URL
    })

  const createSignature = async (safeOperation: SafeOperation, signer: string) => {
    const safe4337Pack = await getSafe4337Pack({ signer })
    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
    const signerAddress = await safe4337Pack.protocolKit.getSafeProvider().getSignerAddress()
    return signedSafeOperation.getSignature(signerAddress!)
  }

  /**
   * Add a new Safe operation to the transaction service.
   * @returns Resolves with the signed Safe operation
   */
  const addSafeOperation = async (): Promise<SafeOperation> => {
    const safeOperation = await safe4337Pack.createTransaction({
      transactions: [transferUSDC]
    })

    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
    const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

    await safeApiKit.addSafeOperation(addSafeOperationProps)

    return signedSafeOperation
  }

  const requestStub = sinon.stub()

  before(async () => {
    sinon.stub(safe4337Utils, 'getEip4337BundlerProvider').returns({
      request: requestStub
    } as unknown as BundlerClient)

    requestStub.withArgs({ method: RPC_4337_CALLS.CHAIN_ID }).resolves('0xaa36a7')
    requestStub
      .withArgs({ method: RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS })
      .resolves([ENTRYPOINT_ADDRESS_V06])
    requestStub
      .withArgs({ method: 'pimlico_getUserOperationGasPrice' })
      .resolves({ fast: { maxFeePerGas: '0x3b9aca00', maxPriorityFeePerGas: '0x3b9aca00' } })

    safe4337Pack = await getSafe4337Pack({ signer: PRIVATE_KEY_1 })
    safeApiKit = getApiKit(TX_SERVICE_URL)

    // Submit a new Safe operation to the transaction service
    safeOperation = await addSafeOperation()
    safeOpHash = safeOperation.getHash()
  })

  after(() => {
    sinon.restore()
  })

  describe('should fail', () => {
    it('if SafeOperation hash is empty', async () => {
      const signature = await createSignature(safeOperation, PRIVATE_KEY_2)
      await chai
        .expect(safeApiKit.confirmSafeOperation('', signature!.data))
        .to.be.rejectedWith('Invalid SafeOperation hash')
    })

    it('if signature is empty', async () => {
      await chai
        .expect(safeApiKit.confirmSafeOperation(safeOpHash, ''))
        .to.be.rejectedWith('Invalid signature')
    })

    it('if signature is invalid', async () => {
      await chai
        .expect(safeApiKit.confirmSafeOperation(safeOpHash, '0xInvalidSignature'))
        .to.be.rejectedWith('Bad Request')
    })
  })

  it('should allow to create and confirm a SafeOperation signature using a Safe signer', async () => {
    const signerAddress1 = await safe4337Pack.protocolKit.getSafeProvider().getSignerAddress()

    // Create a signature for the Safe operation using owner 2
    const signatureSigner2 = await createSignature(safeOperation, PRIVATE_KEY_2)

    // Add the second signature to the Safe operation
    await chai.expect(safeApiKit.confirmSafeOperation(safeOpHash, signatureSigner2!.data)).to.be
      .fulfilled

    // Check that the Safe operation is now confirmed by both owners
    const safeOperationResponse = await safeApiKit.getSafeOperation(safeOpHash)
    chai.expect(safeOperationResponse.confirmations).to.have.lengthOf(2)

    chai
      .expect(safeOperationResponse.confirmations![0].signature)
      .to.eq(safeOperation.getSignature(signerAddress1!)!.data)

    chai.expect(safeOperationResponse.confirmations![1].signature).to.eq(signatureSigner2!.data)
  })
})
