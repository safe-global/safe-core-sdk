import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { createWalletClient, http } from 'viem'
import SafeApiKit, {
  AddMessageOptions,
  AddSafeDelegateProps,
  DeleteSafeDelegateProps
} from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import { DEFAULT_QUEUE_SERVICE_URL } from '@safe-global/api-kit/utils/config'
import Safe from '@safe-global/protocol-kit'
import config from '../utils/config'
import { getApiKit, getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

const chainId = 11155111n
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480a'
const apiBaseUrl = `${DEFAULT_QUEUE_SERVICE_URL}/api/v1`

const signer = createWalletClient({
  transport: http(),
  chain: sepolia,
  account: privateKeyToAccount(PRIVATE_KEY_1)
})

let protocolKit: Safe
let safeApiKit: SafeApiKit
let delegatorAddress: string
let eip3770DelegatorAddress: string

describe('Endpoint tests', () => {
  let fetchData: sinon.SinonStub

  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({ signer: PRIVATE_KEY_1, safeAddress }))
    delegatorAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
    eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    fetchData = sinon
      .stub(httpRequests, 'sendRequest')
      .returns(Promise.resolve({ data: { success: true } }))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  describe('Default queueServiceUrl', () => {
    it('getServiceInfo', async () => {
      await chai
        .expect(safeApiKit.getServiceInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/about`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      await chai
        .expect(safeApiKit.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions/${safeTxHash}`,
        method: 'get'
      })
    })

    it('confirmTransaction', async () => {
      const signature = '0x1234'
      await chai
        .expect(safeApiKit.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions/${safeTxHash}/signatures`,
        method: 'post',
        body: { signatures: [signature] }
      })
    })

    it('getSafeDelegates', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getSafeDelegates EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress: eip3770SafeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getSafeDelegates with all the filters', async () => {
      await chai
        .expect(
          safeApiKit.getSafeDelegates({
            safeAddress,
            delegateAddress,
            delegatorAddress,
            label: 'label',
            limit: 10,
            offset: 5
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates?safe=${safeAddress}&delegate=${delegateAddress}&delegator=${delegatorAddress}&label=label&limit=10&offset=5`,
        method: 'get'
      })
    })

    it('getSafeDelegates without any address', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ label: 'label' }))
        .to.be.rejectedWith(
          'At least one of safeAddress, delegateAddress or delegatorAddress is required'
        )
      chai.expect(fetchData).not.to.have.been.called
    })

    it('addSafeDelegate', async () => {
      const delegateConfig: AddSafeDelegateProps = {
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'label'
      }

      const signature = await signDelegate(signer, delegateAddress, chainId, 'add')
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates`,
        method: 'post',
        body: {
          chainId: Number(chainId),
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
        safeAddress: eip3770SafeAddress,
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress: eip3770DelegatorAddress,
        signer,
        label: 'label'
      }

      const signature = await signDelegate(signer, delegateAddress, chainId, 'add', safeAddress)
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates`,
        method: 'post',
        body: {
          chainId: Number(chainId),
          safe: safeAddress,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          label: 'label',
          signature
        }
      })
    })

    it('updateSafeDelegate', async () => {
      const delegateConfig: AddSafeDelegateProps = {
        safeAddress,
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'new label'
      }

      const signature = await signDelegate(signer, delegateAddress, chainId, 'edit', safeAddress)
      await chai
        .expect(safeApiKit.updateSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates`,
        method: 'patch',
        body: {
          chainId: Number(chainId),
          safe: safeAddress,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          label: 'new label',
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

      const signature = await signDelegate(signer, delegateAddress, chainId, 'delete')
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates`,
        method: 'delete',
        body: {
          chainId: Number(chainId),
          safe: null,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          signature
        }
      })
    })

    it('removeSafeDelegate EIP-3770', async () => {
      const delegateConfig: DeleteSafeDelegateProps = {
        safeAddress: eip3770SafeAddress,
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress,
        signer
      }

      const signature = await signDelegate(signer, delegateAddress, chainId, 'delete', safeAddress)
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/delegates`,
        method: 'delete',
        body: {
          chainId: Number(chainId),
          safe: safeAddress,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          signature
        }
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
            senderSignature: senderSignature.data,
            originName: 'Safe Core SDK',
            originUrl: 'https://safe.global',
            notes: 'notes'
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          chainId: Number(chainId),
          safe: safeAddress,
          signatures: [senderSignature.data],
          originName: 'Safe Core SDK',
          originUrl: 'https://safe.global',
          notes: 'notes',
          nestedTransaction: undefined
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
            senderSignature: senderSignature.data
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          chainId: Number(chainId),
          safe: safeAddress,
          signatures: [senderSignature.data],
          originName: undefined,
          originUrl: undefined,
          notes: undefined,
          nestedTransaction: undefined
        }
      })
    })

    it('deleteTransaction', async () => {
      // The transaction is fetched first to get the Safe address used in the signature domain
      fetchData.onFirstCall().returns(Promise.resolve({ safe: safeAddress }))
      const signature = await signDeleteTransaction(signer, safeTxHash, safeAddress, chainId)

      try {
        await chai
          .expect(safeApiKit.deleteTransaction({ safeTxHash, signer }))
          .to.be.eventually.deep.equals({ data: { success: true } })
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${apiBaseUrl}/multisig-transactions/${safeTxHash}`,
          method: 'get'
        })
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${apiBaseUrl}/multisig-transactions/${safeTxHash}`,
          method: 'delete',
          body: { signature }
        })
      } finally {
        fetchData.resetBehavior()
        fetchData.returns(Promise.resolve({ data: { success: true } }))
      }
    })

    it('getMultisigTransactions', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMultisigTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMultisigTransactions with query params', async () => {
      await chai
        .expect(
          safeApiKit.getMultisigTransactions(safeAddress, {
            executed: true,
            nonceOrder: 'asc',
            limit: 10,
            offset: 2
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}&executed=true&nonceOrder=asc&limit=10&offset=2`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      await chai
        .expect(safeApiKit.getPendingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}`,
        method: 'get'
      })
    })

    it('getPendingTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getPendingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}`,
        method: 'get'
      })
    })

    it('getPendingTransactions with query params', async () => {
      await chai
        .expect(
          safeApiKit.getPendingTransactions(safeAddress, {
            nonceOrder: 'desc',
            limit: 1,
            offset: 1
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}&nonceOrder=desc&limit=1&offset=1`,
        method: 'get'
      })
    })

    it('getMessage', async () => {
      const safeMessageHash = 'safe-message-hash'

      await chai
        .expect(safeApiKit.getMessage(safeMessageHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/messages/${safeMessageHash}`,
        method: 'get'
      })
    })

    it('getMessages', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      await chai
        .expect(safeApiKit.getMessages(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/messages?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMessages with query params', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      await chai
        .expect(safeApiKit.getMessages(safeAddress, { limit: 5, offset: 1 }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/messages?chainId=${chainId}&limit=5&offset=1`,
        method: 'get'
      })
    })

    it('addMessage', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      const body: AddMessageOptions = {
        message: 'message',
        signature: '0x1234'
      }

      await chai
        .expect(safeApiKit.addMessage(safeAddress, body))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/messages`,
        method: 'post',
        body: {
          chainId: Number(chainId),
          message: 'message',
          signatures: ['0x1234'],
          originName: undefined,
          originUrl: undefined
        }
      })

      body.originName = 'Safe Core SDK'
      body.originUrl = 'https://safe.global'

      await chai
        .expect(safeApiKit.addMessage(safeAddress, body))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/safes/${safeAddress}/messages`,
        method: 'post',
        body: {
          chainId: Number(chainId),
          message: 'message',
          signatures: ['0x1234'],
          originName: 'Safe Core SDK',
          originUrl: 'https://safe.global'
        }
      })
    })

    it('addMessageSignature', async () => {
      const safeMessageHash = 'safe-message-hash'
      const signature = '0xSignature'

      await chai
        .expect(safeApiKit.addMessageSignature(safeMessageHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${apiBaseUrl}/messages/${safeMessageHash}/signatures`,
        method: 'post',
        body: {
          signatures: [signature]
        }
      })
    })
  })

  describe('Custom endpoint', () => {
    const queueServiceUrl = 'http://my-custom-queue-service.com/'

    it('should can instantiate the SafeApiKit with a custom endpoint', async () => {
      const apiKit = getApiKit(queueServiceUrl)

      await chai.expect(apiKit.getServiceInfo()).to.be.fulfilled

      chai.expect(fetchData).to.have.been.calledWith({
        url: 'http://my-custom-queue-service.com/api/v1/about',
        method: 'get'
      })
    })
  })
})
