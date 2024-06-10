import { getDefaultProvider, Wallet } from 'ethers'
import SafeApiKit, {
  AddMessageProps,
  AddSafeDelegateProps,
  DeleteSafeDelegateProps,
  SafeMultisigTransactionEstimate
} from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import Safe from '@safe-global/protocol-kit'
import { UserOperation } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import config from '../utils/config'
import { getApiKit, getKits } from '../utils/setupKits'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

const chainId = 11155111n
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
const randomAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
const eip3770RandomAddress = `${config.EIP_3770_PREFIX}:${randomAddress}`
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
const tokenAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
const eip3770TokenAddress = `${config.EIP_3770_PREFIX}:${tokenAddress}`
const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480a'
const txServiceBaseUrl = 'https://safe-transaction-sepolia.safe.global/api'
const defaultProvider = getDefaultProvider(config.JSON_RPC)
const signer = new Wallet(PRIVATE_KEY_1, defaultProvider)

let protocolKit: Safe
let safeApiKit: SafeApiKit
let delegatorAddress: string
let eip3770DelegatorAddress: string

describe('Endpoint tests', () => {
  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({ signer: PRIVATE_KEY_1, safeAddress }))
    delegatorAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
    eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
  })

  const fetchData = sinon
    .stub(httpRequests, 'sendRequest')
    .returns(Promise.resolve({ data: { success: true } }))

  describe('Default txServiceUrl', () => {
    it('getServiceInfo', async () => {
      await chai
        .expect(safeApiKit.getServiceInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/about`,
        method: 'get'
      })
    })

    it('getServiceSingletonsInfo', async () => {
      await chai
        .expect(safeApiKit.getServiceSingletonsInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/about/singletons`,
        method: 'get'
      })
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      await chai
        .expect(safeApiKit.decodeData(data))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/data-decoder/`,
        method: 'post',
        body: { data }
      })
    })

    it('getSafesByOwner', async () => {
      await chai
        .expect(safeApiKit.getSafesByOwner(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByOwner EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafesByOwner(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule', async () => {
      await chai
        .expect(safeApiKit.getSafesByModule(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafesByModule(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      await chai
        .expect(safeApiKit.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/`,
        method: 'get'
      })
    })

    it('getTransactionConfirmations', async () => {
      await chai
        .expect(safeApiKit.getTransactionConfirmations(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('confirmTransaction', async () => {
      const signature = '0x'
      await chai
        .expect(safeApiKit.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('getSafeInfo', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeDelegates', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getSafeDelegates EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress: eip3770SafeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('addSafeDelegate', async () => {
      const delegateConfig: AddSafeDelegateProps = {
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'label'
      }

      const signature = await signDelegate(signer, delegateAddress, chainId)
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates/`,
        method: 'post',
        body: {
          safe: null,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          label: 'label',
          signature
        }
      })
    })

    it('addSafeDelegate EIP-3770', async () => {
      const delegateConfig: AddSafeDelegateProps = {
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress: eip3770DelegatorAddress,
        signer,
        label: 'label'
      }

      const signature = await signDelegate(signer, delegateAddress, chainId)
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates/`,
        method: 'post',
        body: {
          safe: null,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          label: 'label',
          signature
        }
      })
    })

    it('removeSafeDelegate', async () => {
      const delegateConfig: DeleteSafeDelegateProps = {
        delegateAddress,
        delegatorAddress,
        signer
      }

      const signature = await signDelegate(signer, delegateAddress, chainId)
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates/${delegateConfig.delegateAddress}`,
        method: 'delete',
        body: {
          delegator: delegatorAddress,
          signature
        }
      })
    })

    it('removeSafeDelegate', async () => {
      const delegateConfig: DeleteSafeDelegateProps = {
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress,
        signer
      }

      const signature = await signDelegate(signer, delegateAddress, chainId)
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/delegates/${delegateAddress}`,
        method: 'delete',
        body: {
          delegator: delegatorAddress,
          signature
        }
      })
    })

    it('getSafeCreationInfo', async () => {
      await chai
        .expect(safeApiKit.getSafeCreationInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/creation/`,
        method: 'get'
      })
    })

    it('getSafeCreationInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeCreationInfo(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/creation/`,
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
        .expect(safeApiKit.estimateSafeTransaction(safeAddress, safeTransaction))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
        method: 'post',
        body: safeTransaction
      })
    })

    it('estimateSafeTransaction EIP-3770', async () => {
      const safeTransaction: SafeMultisigTransactionEstimate = {
        to: randomAddress,
        value: '0',
        data: '0x',
        operation: 0
      }
      await chai
        .expect(safeApiKit.estimateSafeTransaction(eip3770SafeAddress, safeTransaction))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
        method: 'post',
        body: safeTransaction
      })
    })

    it('proposeTransaction', async () => {
      const safeTransactionData = {
        to: safeAddress,
        data: '0x',
        value: '123456789',
        operation: 1
      }
      const options = {
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1
      }
      const origin = 'Safe Core SDK: Safe API Kit'
      const signerAddress = await signer.getAddress()
      const safeTransaction = await protocolKit.createTransaction({
        transactions: [safeTransactionData],
        options
      })
      const senderSignature = await protocolKit.signHash(safeTxHash)
      await chai
        .expect(
          safeApiKit.proposeTransaction({
            safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash,
            senderAddress: signerAddress,
            senderSignature: senderSignature.data,
            origin
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          contractTransactionHash: safeTxHash,
          sender: signerAddress,
          signature: senderSignature.data,
          origin
        }
      })
    })

    it('proposeTransaction EIP-3770', async () => {
      const safeTransactionData = {
        to: safeAddress,
        data: '0x',
        value: '123456789',
        operation: 1
      }
      const options = {
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1
      }
      const origin = 'Safe Core SDK: Safe API Kit'
      const signerAddress = await signer.getAddress()
      const safeTransaction = await protocolKit.createTransaction({
        transactions: [safeTransactionData],
        options
      })
      const senderSignature = await protocolKit.signHash(safeTxHash)
      await chai
        .expect(
          safeApiKit.proposeTransaction({
            safeAddress: eip3770SafeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash,
            senderAddress: `${config.EIP_3770_PREFIX}:${signerAddress}`,
            senderSignature: senderSignature.data,
            origin
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          contractTransactionHash: safeTxHash,
          sender: signerAddress,
          signature: senderSignature.data,
          origin
        }
      })
    })

    it('getIncomingTransactions', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/incoming-transfers?executed=true`,
        method: 'get'
      })
    })

    it('getIncomingTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/incoming-transfers?executed=true`,
        method: 'get'
      })
    })

    it('getModuleTransactions', async () => {
      await chai
        .expect(safeApiKit.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getModuleTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getModuleTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      const currentNonce = 1
      await chai
        .expect(safeApiKit.getPendingTransactions(safeAddress, currentNonce))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
        method: 'get'
      })
    })

    it('getPendingTransactions EIP-3770', async () => {
      const currentNonce = 1
      await chai
        .expect(safeApiKit.getPendingTransactions(eip3770SafeAddress, currentNonce))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
        method: 'get'
      })
    })

    it('getAllTransactions', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
        method: 'get'
      })
    })

    it('getAllTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
        method: 'get'
      })
    })

    it('getTokens', async () => {
      await chai
        .expect(safeApiKit.getTokenList())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/tokens/`,
        method: 'get'
      })
    })

    it('getToken', async () => {
      await chai
        .expect(safeApiKit.getToken(tokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })

    it('getToken EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getToken(eip3770TokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })

    it('getMessage', async () => {
      const safeMessageHash = 'safe-tx-hash'

      await chai
        .expect(safeApiKit.getMessage(safeMessageHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/messages/${safeMessageHash}/`,
        method: 'get'
      })
    })

    it('getMessages', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      await chai
        .expect(safeApiKit.getMessages(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`,
        method: 'get'
      })
    })

    it('addMessage', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      const body: AddMessageProps = {
        message: 'message',
        signature: '0x'
      }

      await chai
        .expect(safeApiKit.addMessage(safeAddress, body))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`,
        method: 'post',
        body
      })

      body.safeAppId = 123

      await chai
        .expect(safeApiKit.addMessage(safeAddress, body))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/messages/`,
        method: 'post',
        body
      })
    })

    it('addMessageSignature', async () => {
      const safeMessageHash = 'safe-message-hash'
      const signature = '0xSignature'

      await chai
        .expect(safeApiKit.addMessageSignature(safeMessageHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/messages/${safeMessageHash}/signatures/`,
        method: 'post',
        body: {
          signature
        }
      })
    })

    it('getSafeOperationsByAddress', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress({ safeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/safe-operations/`,
        method: 'get'
      })
    })

    it('getSafeOperation', async () => {
      const safeOperationHash = 'safe-operation-hash'

      await chai
        .expect(safeApiKit.getSafeOperation(safeOperationHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safe-operations/${safeOperationHash}/`,
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
      const options = { validAfter: 123, validUntil: 234 }

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            entryPoint,
            moduleAddress,
            options,
            safeAddress,
            userOperation
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })

      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/safe-operations/`,
        method: 'post',
        body: {
          nonce: Number(userOperation.nonce),
          initCode: userOperation.initCode,
          callData: userOperation.callData,
          callGasLimit: userOperation.callGasLimit.toString(),
          verificationGasLimit: userOperation.verificationGasLimit.toString(),
          preVerificationGas: userOperation.preVerificationGas.toString(),
          maxFeePerGas: userOperation.maxFeePerGas.toString(),
          maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
          paymasterAndData: userOperation.paymasterAndData,
          entryPoint,
          ...options,
          signature: userOperation.signature,
          moduleAddress
        }
      })
    })
  })

  describe('Custom endpoint', () => {
    const txServiceUrl = 'http://my-custom-tx-service.com/api'

    it('should can instantiate the SafeApiKit with a custom endpoint', async () => {
      const apiKit = getApiKit(txServiceUrl)

      await chai.expect(apiKit.getServiceInfo()).to.be.fulfilled

      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceUrl}/v1/about`,
        method: 'get'
      })
    })
  })
})
