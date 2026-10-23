import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeApiKit, { SafeMultisigTransactionEstimate } from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import { getTransactionServiceUrl } from '@safe-global/api-kit/utils/config'
import Safe from '@safe-global/protocol-kit'
import { UserOperation } from '@safe-global/types-kit'
import config from '../utils/config'
import { getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

const chainId = 11155111n
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
const randomAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
const eip3770RandomAddress = `${config.EIP_3770_PREFIX}:${randomAddress}`
const tokenAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
const eip3770TokenAddress = `${config.EIP_3770_PREFIX}:${tokenAddress}`
const safeOpHash = '0x8b1840745ec0a6288e868c6e285dadcfebd49e846d307610a9ccd97f445ace93'
const baseUrl = getTransactionServiceUrl(chainId)
const OK = { data: { success: true } }
// FIXME the singleton hack makes that the property is always added by the IndexerClient.
// Remove when it is correctly returned by the service.
const OK_WITH_SINGLETON = { ...OK, singleton: undefined }

let protocolKit: Safe
let safeApiKit: SafeApiKit

describe('Indexer (Transaction Service) endpoints', () => {
  let fetchData: sinon.SinonStub

  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({ signer: PRIVATE_KEY_1, safeAddress }))
    fetchData = sinon.stub(httpRequests, 'sendRequest').returns(Promise.resolve(OK))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  it('getServiceInfo', async () => {
    await chai.expect(safeApiKit.indexer.getServiceInfo()).to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({ url: `${baseUrl}/v1/about`, method: 'get' })
  })

  it('getServiceSingletonsInfo', async () => {
    await chai
      .expect(safeApiKit.indexer.getServiceSingletonsInfo())
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/about/singletons`,
      method: 'get'
    })
  })

  it('getSafesByOwner', async () => {
    await chai
      .expect(safeApiKit.indexer.getSafesByOwner(eip3770RandomAddress))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/owners/${randomAddress}/safes/`,
      method: 'get'
    })
    await chai
      .expect(safeApiKit.indexer.getSafesByOwner(''))
      .to.be.rejectedWith('Invalid owner address')
  })

  it('getSafesByModule', async () => {
    await chai
      .expect(safeApiKit.indexer.getSafesByModule(eip3770RandomAddress))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/modules/${randomAddress}/safes/`,
      method: 'get'
    })
    await chai
      .expect(safeApiKit.indexer.getSafesByModule(''))
      .to.be.rejectedWith('Invalid module address')
  })

  it('getSafeInfo', async () => {
    await chai
      .expect(safeApiKit.indexer.getSafeInfo(eip3770SafeAddress))
      .to.be.eventually.deep.equals(OK_WITH_SINGLETON)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/`,
      method: 'get'
    })
    await chai.expect(safeApiKit.indexer.getSafeInfo('')).to.be.rejectedWith('Invalid Safe address')
  })

  it('getSafeCreationInfo', async () => {
    await chai
      .expect(safeApiKit.indexer.getSafeCreationInfo(eip3770SafeAddress))
      .to.be.eventually.deep.equals(OK_WITH_SINGLETON)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/creation/`,
      method: 'get'
    })
  })

  it('estimateSafeTransaction', async () => {
    const safeTransaction: SafeMultisigTransactionEstimate = {
      to: randomAddress,
      value: '0',
      data: '0x',
      operation: 0
    }
    await chai
      .expect(safeApiKit.indexer.estimateSafeTransaction(eip3770SafeAddress, safeTransaction))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
      method: 'post',
      body: safeTransaction
    })
  })

  it('getIncomingTransactions', async () => {
    await chai
      .expect(safeApiKit.indexer.getIncomingTransactions(eip3770SafeAddress))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/incoming-transfers/`,
      method: 'get'
    })
  })

  it('getIncomingTransactions with query params', async () => {
    await chai
      .expect(safeApiKit.indexer.getIncomingTransactions(safeAddress, { from: safeAddress }))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/incoming-transfers/?_from=${safeAddress}`,
      method: 'get'
    })
  })

  it('getModuleTransactions', async () => {
    await chai
      .expect(
        safeApiKit.indexer.getModuleTransactions(eip3770SafeAddress, { module: randomAddress })
      )
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/safes/${safeAddress}/module-transactions/?module=${randomAddress}`,
      method: 'get'
    })
  })

  it('getAllTransactions', async () => {
    await chai
      .expect(safeApiKit.indexer.getAllTransactions(eip3770SafeAddress, { limit: 5 }))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v2/safes/${safeAddress}/all-transactions/?limit=5`,
      method: 'get'
    })
  })

  it('getTokenList', async () => {
    await chai
      .expect(safeApiKit.indexer.getTokenList({ search: 'USD' }))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/tokens/?search=USD`,
      method: 'get'
    })
  })

  it('getToken', async () => {
    await chai
      .expect(safeApiKit.indexer.getToken(eip3770TokenAddress))
      .to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({
      url: `${baseUrl}/v1/tokens/${tokenAddress}/`,
      method: 'get'
    })
    await chai.expect(safeApiKit.indexer.getToken('')).to.be.rejectedWith('Invalid token address')
  })

  describe('SafeOperations', () => {
    it('getSafeOperationsByAddress', async () => {
      await chai
        .expect(safeApiKit.indexer.getSafeOperationsByAddress(safeAddress))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safes/${safeAddress}/safe-operations/`,
        method: 'get'
      })
    })

    it('getPendingSafeOperations', async () => {
      await chai
        .expect(safeApiKit.indexer.getPendingSafeOperations(safeAddress))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safes/${safeAddress}/safe-operations/?executed=false`,
        method: 'get'
      })
    })

    it('getSafeOperation', async () => {
      await chai
        .expect(safeApiKit.indexer.getSafeOperation(safeOpHash))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safe-operations/${safeOpHash}/`,
        method: 'get'
      })
    })

    it('addSafeOperation', async () => {
      const moduleAddress = '0xa581c4A4DB7175302464fF3C06380BC3270b4037'

      const userOperation: UserOperation = {
        sender: safeAddress,
        nonce: '42',
        initCode: '0xfbc38024f74946d9ec31e0c8658dd65e335c6e57c14575250787ec5fb270c08a',
        callData:
          '0x7bb374280000000000000000000000001c7d4b196cb0c7b01d743fbc6116a902379c72380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000060c4ab82d06fd7dfe9517e17736c2dcc77443ef000000000000000000000000000000000000000000000000000000000000186a000000000000000000000000000000000000000000000000000000000',
        callGasLimit: 150799n,
        verificationGasLimit: 200691n,
        preVerificationGas: 50943n,
        maxFeePerGas: 1949282597n,
        maxPriorityFeePerGas: 1380000000n,
        paymasterAndData: '0xdff7fa1077bce740a6a212b3995990682c0ba66d',
        signature: '0xsignature'
      }

      const entryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

      const externalProvider = protocolKit.getSafeProvider().getExternalProvider()
      const timestamp = Number((await externalProvider.getBlock())?.timestamp) || 0

      const validAfter = timestamp - 60_000
      const validUntil = timestamp + 60_000
      const options = { validAfter, validUntil }

      await chai
        .expect(
          safeApiKit.indexer.addSafeOperation({
            entryPoint,
            moduleAddress,
            options,
            safeAddress,
            userOperation
          })
        )
        .to.be.eventually.deep.equals(OK)

      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safes/${safeAddress}/safe-operations/`,
        method: 'post',
        body: {
          nonce: userOperation.nonce,
          initCode: userOperation.initCode,
          callData: userOperation.callData,
          callGasLimit: userOperation.callGasLimit.toString(),
          verificationGasLimit: userOperation.verificationGasLimit.toString(),
          preVerificationGas: userOperation.preVerificationGas.toString(),
          maxFeePerGas: userOperation.maxFeePerGas.toString(),
          maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
          paymasterAndData: userOperation.paymasterAndData,
          entryPoint,
          validAfter: new Date(validAfter * 1000).toISOString(),
          validUntil: new Date(validUntil * 1000).toISOString(),
          signature: userOperation.signature,
          moduleAddress
        }
      })
    })

    it('getSafeOperationConfirmations', async () => {
      await chai
        .expect(safeApiKit.indexer.getSafeOperationConfirmations(safeOpHash, { limit: 2 }))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safe-operations/${safeOpHash}/confirmations/?limit=2`,
        method: 'get'
      })
    })

    it('confirmSafeOperation', async () => {
      const senderSignature = await protocolKit.signHash(safeOpHash)
      await chai
        .expect(safeApiKit.indexer.confirmSafeOperation(safeOpHash, senderSignature.data))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/v1/safe-operations/${safeOpHash}/confirmations/`,
        method: 'post',
        body: {
          signature:
            '0x23e70757bcfe1ccba40588ee3ec8fbca7ff4b51ad48703a598fbe98b935b927d064a98cdcfaf2eff00ae05628ed38f15799a732e143f9fce7215a62fe8e14ff020'
        }
      })
    })
  })

  it('uses the custom txServiceUrl', async () => {
    const txServiceUrl = 'http://my-custom-tx-service.com/api'
    const apiKit = new SafeApiKit({
      chainId,
      txServiceUrl,
      queueServiceUrl: 'http://my-custom-queue-service.com',
      decoderServiceUrl: 'http://my-custom-decoder-service.com'
    })
    await chai.expect(apiKit.indexer.getServiceInfo()).to.be.fulfilled
    chai
      .expect(fetchData)
      .to.have.been.calledWith({ url: `${txServiceUrl}/v1/about`, method: 'get' })
  })
})
