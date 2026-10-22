import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { createWalletClient, http, zeroAddress } from 'viem'
import SafeApiKit, { AddDelegateProps, RemoveDelegateProps } from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import { DEFAULT_QUEUE_SERVICE_URL } from '@safe-global/api-kit/utils/config'
import Safe from '@safe-global/protocol-kit'
import config from '../utils/config'
import { getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const PRIVATE_KEY_1 = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'

const chainId = 11155111n
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
const otherSafeAddress = '0x4103eEB76EBBcB652F8B15d3817EBFC07b664b0c'
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
const safeTxHash = '0x317834aea988fd3cfa54fd8b2be2c96b4fd70a14d8c9470a7110576b01e6480a'
const otherSafeTxHash = '0x0000000000000000000000000000000000000000000000000000000000000001'
const baseUrl = `${DEFAULT_QUEUE_SERVICE_URL}/api/v1`
const OK = { data: { success: true } }

const signer = createWalletClient({
  transport: http(),
  chain: sepolia,
  account: privateKeyToAccount(PRIVATE_KEY_1)
})

let protocolKit: Safe
let safeApiKit: SafeApiKit
let delegatorAddress: string
let eip3770DelegatorAddress: string

describe('Queue service endpoints', () => {
  let fetchData: sinon.SinonStub

  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({ signer: PRIVATE_KEY_1, safeAddress }))
    delegatorAddress = (await protocolKit.getSafeProvider().getSignerAddress()) || '0x'
    eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
    fetchData = sinon.stub(httpRequests, 'sendRequest').returns(Promise.resolve(OK))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  it('getServiceInfo', async () => {
    await chai.expect(safeApiKit.queue.getServiceInfo()).to.be.eventually.deep.equals(OK)
    chai.expect(fetchData).to.have.been.calledWith({ url: `${baseUrl}/about`, method: 'get' })
  })

  describe('delegates', () => {
    it('getDelegates', async () => {
      await chai
        .expect(safeApiKit.queue.getDelegates({ safeAddress }))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getDelegates EIP-3770', async () => {
      await chai
        .expect(safeApiKit.queue.getDelegates({ safeAddress: eip3770SafeAddress }))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getDelegates with all the filters', async () => {
      await chai
        .expect(
          safeApiKit.queue.getDelegates({
            safeAddress,
            delegateAddress,
            delegatorAddress,
            chainId,
            label: 'label',
            limit: 10,
            offset: 5
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates?chainId=${chainId}&safe=${safeAddress}&delegate=${delegateAddress}&delegator=${delegatorAddress}&label=label&limit=10&offset=5`,
        method: 'get'
      })
    })

    it('getDelegates without any address', async () => {
      await chai
        .expect(safeApiKit.queue.getDelegates({ label: 'label' }))
        .to.be.rejectedWith(
          'At least one of safeAddress, delegateAddress or delegatorAddress is required'
        )
      chai.expect(fetchData).not.to.have.been.called
    })

    it('addDelegate', async () => {
      const props: AddDelegateProps = { delegateAddress, delegatorAddress, signer, label: 'label' }
      const signature = await signDelegate(signer, delegateAddress, chainId, 'add')

      await chai.expect(safeApiKit.queue.addDelegate(props)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
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

    it('addDelegate scoped to a Safe, EIP-3770', async () => {
      const props: AddDelegateProps = {
        safeAddress: eip3770SafeAddress,
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress: eip3770DelegatorAddress,
        signer,
        label: 'label'
      }
      const signature = await signDelegate(signer, delegateAddress, chainId, 'add', safeAddress)

      await chai.expect(safeApiKit.queue.addDelegate(props)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
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

    it('addDelegate for all chains', async () => {
      const props: AddDelegateProps = {
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'label',
        allChains: true
      }
      const signature = await signDelegate(signer, delegateAddress, 0n, 'add')

      await chai.expect(safeApiKit.queue.addDelegate(props)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
        method: 'post',
        body: {
          chainId: null,
          safe: null,
          delegate: delegateAddress,
          delegator: delegatorAddress,
          label: 'label',
          signature
        }
      })
    })

    it('addDelegate validations', async () => {
      const base = { delegateAddress, delegatorAddress, signer, label: 'label' }
      await chai
        .expect(safeApiKit.queue.addDelegate({ ...base, delegateAddress: '' }))
        .to.be.rejectedWith('Invalid Safe delegate address')
      await chai
        .expect(safeApiKit.queue.addDelegate({ ...base, delegatorAddress: '' }))
        .to.be.rejectedWith('Invalid Safe delegator address')
      await chai
        .expect(safeApiKit.queue.addDelegate({ ...base, label: '' }))
        .to.be.rejectedWith('Invalid label')
      chai.expect(fetchData).not.to.have.been.called
    })

    it('updateDelegate', async () => {
      const props: AddDelegateProps = {
        safeAddress,
        delegateAddress,
        delegatorAddress,
        signer,
        label: 'new label'
      }
      const signature = await signDelegate(signer, delegateAddress, chainId, 'edit', safeAddress)

      await chai.expect(safeApiKit.queue.updateDelegate(props)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
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

    it('removeDelegate', async () => {
      const props: RemoveDelegateProps = { delegateAddress, delegatorAddress, signer }
      const signature = await signDelegate(signer, delegateAddress, chainId, 'delete')

      await chai.expect(safeApiKit.queue.removeDelegate(props)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
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

    it('removeDelegate scoped to a Safe, EIP-3770', async () => {
      const props: RemoveDelegateProps = {
        safeAddress: eip3770SafeAddress,
        delegateAddress: eip3770DelegateAddress,
        delegatorAddress,
        signer
      }
      const signature = await signDelegate(signer, delegateAddress, chainId, 'delete', safeAddress)

      await chai.expect(safeApiKit.queue.removeDelegate(props)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
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

    it('removeDelegate every delegate of the delegator with the zero address', async () => {
      const props: RemoveDelegateProps = { delegateAddress: zeroAddress, delegatorAddress, signer }
      const signature = await signDelegate(signer, zeroAddress, chainId, 'delete')

      await chai.expect(safeApiKit.queue.removeDelegate(props)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/delegates`,
        method: 'delete',
        body: {
          chainId: Number(chainId),
          safe: null,
          delegate: zeroAddress,
          delegator: delegatorAddress,
          signature
        }
      })
    })
  })

  describe('multisig transactions', () => {
    const safeTransactionData = { to: safeAddress, data: '0x', value: '123456789', operation: 1 }
    const options = {
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 1
    }
    let signature: string

    before(async () => {
      signature = (await protocolKit.signHash(safeTxHash)).data
    })

    const getTransactionData = async () =>
      (await protocolKit.createTransaction({ transactions: [safeTransactionData], options })).data

    it('proposeTransaction', async () => {
      await chai
        .expect(
          safeApiKit.queue.proposeTransaction({
            safeAddress,
            safeTransactionData: await getTransactionData(),
            signatures: signature,
            originName: 'Safe Core SDK',
            originUrl: 'https://safe.global',
            notes: 'notes'
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          chainId: Number(chainId),
          safe: safeAddress,
          signatures: [signature],
          originName: 'Safe Core SDK',
          originUrl: 'https://safe.global',
          notes: 'notes',
          nestedTransaction: undefined
        }
      })
    })

    it('proposeTransaction EIP-3770 with several signatures', async () => {
      await chai
        .expect(
          safeApiKit.queue.proposeTransaction({
            safeAddress: eip3770SafeAddress,
            safeTransactionData: await getTransactionData(),
            signatures: [signature, '0x1234']
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions`,
        method: 'post',
        body: {
          ...safeTransactionData,
          ...options,
          chainId: Number(chainId),
          safe: safeAddress,
          signatures: [signature, '0x1234'],
          originName: undefined,
          originUrl: undefined,
          notes: undefined,
          nestedTransaction: undefined
        }
      })
    })

    it('proposeTransaction validations', async () => {
      const safeTransactionData = await getTransactionData()
      await chai
        .expect(
          safeApiKit.queue.proposeTransaction({
            safeAddress: '',
            safeTransactionData,
            signatures: signature
          })
        )
        .to.be.rejectedWith('Invalid Safe address')
      await chai
        .expect(
          safeApiKit.queue.proposeTransaction({ safeAddress, safeTransactionData, signatures: [] })
        )
        .to.be.rejectedWith('Invalid signatures')
      chai.expect(fetchData).not.to.have.been.called
    })

    it('getTransactions of several Safes', async () => {
      await chai
        .expect(
          safeApiKit.queue.getTransactions({
            safes: [eip3770SafeAddress, { address: otherSafeAddress, chainIds: [1n, 137n] }],
            executed: false,
            nonceOrder: 'asc',
            limit: 10,
            offset: 2
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions?safes=${safeAddress}&safes=${otherSafeAddress}%3A1%3A137&executed=false&nonceOrder=asc&limit=10&offset=2`,
        method: 'get'
      })
    })

    it('getTransactions without Safes', async () => {
      await chai
        .expect(safeApiKit.queue.getTransactions({ safes: [] }))
        .to.be.rejectedWith('At least one Safe is required')
    })

    it('getPendingTransactions', async () => {
      await chai
        .expect(safeApiKit.queue.getPendingTransactions(safeAddress))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}`,
        method: 'get'
      })
    })

    it('getPendingTransactions of several Safes with query params', async () => {
      await chai
        .expect(
          safeApiKit.queue.getPendingTransactions([eip3770SafeAddress, otherSafeAddress], {
            nonceOrder: 'desc',
            limit: 1,
            offset: 1
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}&safes=${otherSafeAddress}%3A${chainId}&nonceOrder=desc&limit=1&offset=1`,
        method: 'get'
      })
    })

    it('getPendingTransactions validations', async () => {
      await chai
        .expect(safeApiKit.queue.getPendingTransactions(''))
        .to.be.rejectedWith('Invalid Safe address')
      await chai
        .expect(safeApiKit.queue.getPendingTransactions([]))
        .to.be.rejectedWith('Invalid Safe address')
    })

    it('getTransactionsBatch', async () => {
      await chai
        .expect(safeApiKit.queue.getTransactionsBatch([safeTxHash, otherSafeTxHash]))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/batch?safeTxHash=${safeTxHash}&safeTxHash=${otherSafeTxHash}`,
        method: 'get'
      })
      await chai
        .expect(safeApiKit.queue.getTransactionsBatch([]))
        .to.be.rejectedWith('At least one safeTxHash is required')
    })

    it('getTransaction', async () => {
      await chai
        .expect(safeApiKit.queue.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/${safeTxHash}`,
        method: 'get'
      })
      await chai
        .expect(safeApiKit.queue.getTransaction(''))
        .to.be.rejectedWith('Invalid safeTxHash')
    })

    it('deleteTransaction', async () => {
      const signature = await signDeleteTransaction(signer, safeTxHash, safeAddress, chainId)

      await chai.expect(
        safeApiKit.queue.deleteTransaction({
          safeTxHash,
          safeAddress: eip3770SafeAddress,
          signer
        })
      ).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/${safeTxHash}`,
        method: 'delete',
        body: { signature }
      })
      await chai
        .expect(safeApiKit.queue.deleteTransaction({ safeTxHash: '', safeAddress, signer }))
        .to.be.rejectedWith('Invalid safeTxHash')
      await chai
        .expect(safeApiKit.queue.deleteTransaction({ safeTxHash, safeAddress: '', signer }))
        .to.be.rejectedWith('Invalid Safe address')
    })

    it('getSafeTransactions', async () => {
      await chai
        .expect(safeApiKit.queue.getSafeTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getSafeTransactions with query params and all chains', async () => {
      await chai
        .expect(
          safeApiKit.queue.getSafeTransactions(safeAddress, {
            executed: true,
            nonceOrder: 'asc',
            allChains: true,
            limit: 10,
            offset: 2
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/multisig-transactions?executed=true&nonceOrder=asc&limit=10&offset=2`,
        method: 'get'
      })
    })

    it('confirmTransaction', async () => {
      await chai
        .expect(safeApiKit.queue.confirmTransaction(safeTxHash, '0x1234'))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/${safeTxHash}/signatures`,
        method: 'post',
        body: { signatures: ['0x1234'] }
      })
      await chai
        .expect(safeApiKit.queue.confirmTransaction(safeTxHash, ['0x1234', '0x5678']))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/multisig-transactions/${safeTxHash}/signatures`,
        method: 'post',
        body: { signatures: ['0x1234', '0x5678'] }
      })
      await chai
        .expect(safeApiKit.queue.confirmTransaction(safeTxHash, ''))
        .to.be.rejectedWith('Invalid signatures')
    })
  })

  describe('messages', () => {
    const messageHash = 'safe-message-hash'

    it('addMessage', async () => {
      await chai
        .expect(
          safeApiKit.queue.addMessage(safeAddress, { message: 'message', signatures: '0x1234' })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/messages`,
        method: 'post',
        body: {
          chainId: Number(chainId),
          message: 'message',
          signatures: ['0x1234'],
          originName: undefined,
          originUrl: undefined
        }
      })
    })

    it('addMessage with origin', async () => {
      await chai
        .expect(
          safeApiKit.queue.addMessage(safeAddress, {
            message: 'message',
            signatures: ['0x1234'],
            originName: 'Safe Core SDK',
            originUrl: 'https://safe.global'
          })
        )
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/messages`,
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

    it('addMessage validations', async () => {
      await chai
        .expect(safeApiKit.queue.addMessage('0x123', { message: 'message', signatures: '0x1234' }))
        .to.be.rejectedWith('Invalid Safe address')
      await chai
        .expect(safeApiKit.queue.addMessage(safeAddress, { message: 'message', signatures: '' }))
        .to.be.rejectedWith('Invalid signatures')
    })

    it('getMessages', async () => {
      await chai.expect(safeApiKit.queue.getMessages(safeAddress)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/messages?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMessages with query params and all chains', async () => {
      await chai
        .expect(safeApiKit.queue.getMessages(safeAddress, { allChains: true, limit: 5, offset: 1 }))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/safes/${safeAddress}/messages?limit=5&offset=1`,
        method: 'get'
      })
    })

    it('getMessage', async () => {
      await chai.expect(safeApiKit.queue.getMessage(messageHash)).to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/messages/${messageHash}`,
        method: 'get'
      })
      await chai.expect(safeApiKit.queue.getMessage('')).to.be.rejectedWith('Invalid messageHash')
    })

    it('confirmMessage', async () => {
      await chai
        .expect(safeApiKit.queue.confirmMessage(messageHash, '0x1234'))
        .to.be.eventually.deep.equals(OK)
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${baseUrl}/messages/${messageHash}/signatures`,
        method: 'post',
        body: { signatures: ['0x1234'] }
      })
      await chai
        .expect(safeApiKit.queue.confirmMessage('', '0x1234'))
        .to.be.rejectedWith('Invalid messageHash')
    })
  })

  describe('custom endpoint', () => {
    it('uses the custom queueServiceUrl', async () => {
      const apiKit = new SafeApiKit({
        chainId,
        txServiceUrl: 'http://my-custom-tx-service.com/api',
        queueServiceUrl: 'http://my-custom-queue-service.com/',
        decoderServiceUrl: 'http://my-custom-decoder-service.com'
      })
      await chai.expect(apiKit.queue.getTransaction(safeTxHash)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `http://my-custom-queue-service.com/api/v1/multisig-transactions/${safeTxHash}`,
        method: 'get'
      })
    })
  })
})
