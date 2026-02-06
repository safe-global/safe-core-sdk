import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Safe4337InitOptions, Safe4337Pack, SafeOperation } from '@safe-global/relay-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import { getAddSafeOperationProps } from '@safe-global/api-kit/utils/safeOperation'
import { generateTransferCallData } from '@safe-global/relay-kit/test-utils'
import { getApiKit, getEip1193Provider } from '../utils/setupKits'
import {
  getSafeWith4337Module,
  PRIVATE_KEY_1,
  PRIVATE_KEY_2,
  safeVersionDeployed
} from 'tests/helpers/safe'
import { describeif } from 'tests/utils/heplers'
import { Address } from 'viem'

chai.use(chaiAsPromised)
const BUNDLER_URL = 'https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_Vjs7ohRqWdvsjUegngf9Bg'
const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

let safeApiKit: SafeApiKit
let safe4337Pack: Safe4337Pack
let safeOperation: SafeOperation
let safeOpHash: string

describeif(safeVersionDeployed == '1.4.1')('confirmSafeOperation', () => {
  let SAFE_ADDRESS: Address
  let transferUSDC: { to: string; data: string; value: string; operation: number }

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

  before(async () => {
    SAFE_ADDRESS = getSafeWith4337Module()
    transferUSDC = {
      to: PAYMASTER_TOKEN_ADDRESS,
      data: generateTransferCallData(SAFE_ADDRESS, 100_000n) + Date.now().toString(), // Make sure that the transaction hash is unique
      value: '0',
      operation: 0
    }
    safe4337Pack = await getSafe4337Pack({ signer: PRIVATE_KEY_1 })
    safeApiKit = getApiKit()

    // Submit a new Safe operation to the transaction service
    safeOperation = await addSafeOperation()
    safeOpHash = safeOperation.getHash()
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
