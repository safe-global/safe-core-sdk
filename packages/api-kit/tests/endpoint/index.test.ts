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
  DeleteSafeDelegateProps,
  SafeMultisigTransactionEstimate
} from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import Safe from '@safe-global/protocol-kit'
import { UserOperation } from '@safe-global/types-kit'
import { signDelegate } from '@safe-global/api-kit/utils/signDelegate'
import { signDeleteTransaction } from '@safe-global/api-kit/utils/signDeleteTransaction'
import config from '../utils/config'
import { getKits } from '../utils/setupKits'
import {
  DEFAULT_DECODER_SERVICE_URL,
  DEFAULT_QUEUE_SERVICE_URL,
  getTransactionServiceUrl
} from '@safe-global/api-kit/utils/config'

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
const safeOpHash = '0x8b1840745ec0a6288e868c6e285dadcfebd49e846d307610a9ccd97f445ace93'
const txServiceBaseUrl = getTransactionServiceUrl(11155111n)
const queueServiceBaseUrl = `${DEFAULT_QUEUE_SERVICE_URL}/api/v1`
const decoderServiceBaseUrl = `${DEFAULT_DECODER_SERVICE_URL}/api/v1`

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

  describe('Default service URLs', () => {
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
        url: `${decoderServiceBaseUrl}/data-decoder`,
        method: 'post',
        body: { data }
      })
    })

    it('decodeData with the receiving contract', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      await chai
        .expect(safeApiKit.decodeData(data, randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${decoderServiceBaseUrl}/data-decoder`,
        method: 'post',
        body: { data, to: randomAddress, chainId: Number(chainId) }
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
        url: `${queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
        method: 'get'
      })
    })

    it('getTransactionConfirmations', async () => {
      const confirmations = [{ owner: randomAddress, signature: '0x1234' }]
      fetchData.onFirstCall().returns(Promise.resolve({ safeTxHash, confirmations }))

      try {
        await chai
          .expect(safeApiKit.getTransactionConfirmations(safeTxHash))
          .to.be.eventually.deep.equals({ count: 1, results: confirmations })
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
          method: 'get'
        })
      } finally {
        fetchData.resetBehavior()
        fetchData.returns(Promise.resolve({ data: { success: true } }))
      }
    })

    it('getTransactionConfirmations of a transaction that does not exist', async () => {
      fetchData
        .onFirstCall()
        .returns(Promise.reject(new httpRequests.HttpError(404, 'Not found', {})))

      try {
        await chai
          .expect(safeApiKit.getTransactionConfirmations(safeTxHash))
          .to.be.eventually.deep.equals({ count: 0, results: [] })
      } finally {
        fetchData.resetBehavior()
        fetchData.returns(Promise.resolve({ data: { success: true } }))
      }
    })

    it('confirmTransaction', async () => {
      const signature = '0x1234'
      await chai
        .expect(safeApiKit.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/multisig-transactions/${safeTxHash}/signatures`,
        method: 'post',
        body: { signatures: [signature] }
      })
    })

    it('getSafeInfo', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(safeAddress))
        // FIXME the singleton hack makes that the property is always added by SafeApiKit.
        // Remove when is correctly returned by the service.
        .to.be.eventually.deep.equals({ data: { success: true }, singleton: undefined })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(eip3770SafeAddress))
        // FIXME the singleton hack makes that the property is always added by SafeApiKit.
        // Remove when is correctly returned by the service.
        .to.be.eventually.deep.equals({ data: { success: true }, singleton: undefined })
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
        url: `${queueServiceBaseUrl}/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getSafeDelegates EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress: eip3770SafeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates?safe=${safeAddress}`,
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
        url: `${queueServiceBaseUrl}/delegates?safe=${safeAddress}&delegate=${delegateAddress}&delegator=${delegatorAddress}&label=label&limit=10&offset=5`,
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
        .to.be.eventually.deep.equals({ data: { success: true }, signature })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates`,
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
        .to.be.eventually.deep.equals({ data: { success: true }, signature })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates`,
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
        .to.be.eventually.deep.equals({ data: { success: true }, signature })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates`,
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
      await chai.expect(safeApiKit.removeSafeDelegate(delegateConfig)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates`,
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
      await chai.expect(safeApiKit.removeSafeDelegate(delegateConfig)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/delegates`,
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

    it('getSafeCreationInfo', async () => {
      await chai
        .expect(safeApiKit.getSafeCreationInfo(safeAddress))
        // FIXME the singleton hack makes that the property is always added by SafeApiKit.
        // Remove when is correctly returned by the service.
        .to.be.eventually.deep.equals({ data: { success: true }, singleton: undefined })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/creation/`,
        method: 'get'
      })
    })

    it('getSafeCreationInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeCreationInfo(eip3770SafeAddress))
        // FIXME the singleton hack makes that the property is always added by SafeApiKit.
        // Remove when is correctly returned by the service.
        .to.be.eventually.deep.equals({ data: { success: true }, singleton: undefined })
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

    describe('proposeTransaction', () => {
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
      const proposedTransaction = { safeTxHash, confirmations: [] }
      let senderSignature: string

      before(async () => {
        senderSignature = (await protocolKit.signHash(safeTxHash)).data
      })

      beforeEach(() => {
        fetchData.returns(Promise.resolve(proposedTransaction))
      })

      after(() => {
        fetchData.resetBehavior()
        fetchData.returns(Promise.resolve({ data: { success: true } }))
      })

      const getTransactionData = async () =>
        (await protocolKit.createTransaction({ transactions: [safeTransactionData], options })).data

      it('proposeTransaction', async () => {
        await chai
          .expect(
            safeApiKit.proposeTransaction({
              safeAddress,
              safeTransactionData: await getTransactionData(),
              safeTxHash,
              senderAddress: signer.account.address,
              senderSignature,
              originName: 'Safe Core SDK',
              originUrl: 'https://safe.global',
              notes: 'notes'
            })
          )
          .to.be.eventually.deep.equals(proposedTransaction)
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${queueServiceBaseUrl}/multisig-transactions`,
          method: 'post',
          body: {
            ...safeTransactionData,
            ...options,
            chainId: Number(chainId),
            safe: safeAddress,
            signatures: [senderSignature],
            originName: 'Safe Core SDK',
            originUrl: 'https://safe.global',
            notes: 'notes',
            nestedTransaction: undefined
          }
        })
      })

      it('proposeTransaction EIP-3770', async () => {
        await chai
          .expect(
            safeApiKit.proposeTransaction({
              safeAddress: eip3770SafeAddress,
              safeTransactionData: await getTransactionData(),
              senderSignature
            })
          )
          .to.be.eventually.deep.equals(proposedTransaction)
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${queueServiceBaseUrl}/multisig-transactions`,
          method: 'post',
          body: {
            ...safeTransactionData,
            ...options,
            chainId: Number(chainId),
            safe: safeAddress,
            signatures: [senderSignature],
            originName: undefined,
            originUrl: undefined,
            notes: undefined,
            nestedTransaction: undefined
          }
        })
      })

      it('proposeTransaction with a legacy JSON origin', async () => {
        await safeApiKit.proposeTransaction({
          safeAddress,
          safeTransactionData: await getTransactionData(),
          senderSignature,
          origin: JSON.stringify({ name: 'Safe{Wallet}', url: 'https://app.safe.global' })
        })
        chai.expect(fetchData).to.have.been.calledWith(
          sinon.match({
            body: sinon.match({ originName: 'Safe{Wallet}', originUrl: 'https://app.safe.global' })
          })
        )
      })

      it('proposeTransaction with a legacy plain origin', async () => {
        await safeApiKit.proposeTransaction({
          safeAddress,
          safeTransactionData: await getTransactionData(),
          senderSignature,
          origin: 'Safe Core SDK: Safe API Kit'
        })
        chai.expect(fetchData).to.have.been.calledWith(
          sinon.match({
            body: sinon.match({ originName: 'Safe Core SDK: Safe API Kit', originUrl: undefined })
          })
        )
      })

      it('proposeTransaction with a safeTxHash that does not match the one of the service', async () => {
        const otherSafeTxHash = '0x0000000000000000000000000000000000000000000000000000000000000001'
        await chai
          .expect(
            safeApiKit.proposeTransaction({
              safeAddress,
              safeTransactionData: await getTransactionData(),
              safeTxHash: otherSafeTxHash,
              senderSignature
            })
          )
          .to.be.rejectedWith(
            `The safeTxHash ${otherSafeTxHash} does not match the hash calculated by the service ${safeTxHash}`
          )
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
          url: `${queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
          method: 'get'
        })
        chai.expect(fetchData).to.have.been.calledWith({
          url: `${queueServiceBaseUrl}/multisig-transactions/${safeTxHash}`,
          method: 'delete',
          body: { signature }
        })
      } finally {
        fetchData.resetBehavior()
        fetchData.returns(Promise.resolve({ data: { success: true } }))
      }
    })

    it('getIncomingTransactions', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getIncomingTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getIncomingTransactions with default query params', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(safeAddress, { from: safeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/incoming-transfers/?_from=${safeAddress}`,
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
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMultisigTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}`,
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
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/multisig-transactions?chainId=${chainId}&executed=true&nonceOrder=asc&limit=10&offset=2`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      await chai
        .expect(safeApiKit.getPendingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}`,
        method: 'get'
      })
    })

    it('getPendingTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getPendingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}`,
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
        url: `${queueServiceBaseUrl}/multisig-transactions/queue?safes=${safeAddress}%3A${chainId}&nonceOrder=desc&limit=1&offset=1`,
        method: 'get'
      })
    })

    it('getAllTransactions', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/safes/${safeAddress}/all-transactions/`,
        method: 'get'
      })
    })

    it('getAllTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v2/safes/${safeAddress}/all-transactions/`,
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
      const safeMessageHash = 'safe-message-hash'

      await chai
        .expect(safeApiKit.getMessage(safeMessageHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/messages/${safeMessageHash}`,
        method: 'get'
      })
    })

    it('getMessages', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      await chai
        .expect(safeApiKit.getMessages(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/messages?chainId=${chainId}`,
        method: 'get'
      })
    })

    it('getMessages with query params', async () => {
      const safeAddress = '0x6C465b1D7aBCcDC02Ed48bc32e289795603a5c79'

      await chai
        .expect(safeApiKit.getMessages(safeAddress, { limit: 5, offset: 1 }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/messages?chainId=${chainId}&limit=5&offset=1`,
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
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/messages`,
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
        url: `${queueServiceBaseUrl}/safes/${safeAddress}/messages`,
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
        url: `${queueServiceBaseUrl}/messages/${safeMessageHash}/signatures`,
        method: 'post',
        body: {
          signatures: [signature]
        }
      })
    })

    it('getSafeOperationsByAddress', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safes/${safeAddress}/safe-operations/`,
        method: 'get'
      })
    })

    it('getSafeOperation', async () => {
      await chai
        .expect(safeApiKit.getSafeOperation(safeOpHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safe-operations/${safeOpHash}/`,
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
        .expect(safeApiKit.getSafeOperationConfirmations(safeOpHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safe-operations/${safeOpHash}/confirmations/`,
        method: 'get'
      })
    })

    it('confirmSafeOperation', async () => {
      const senderSignature = await protocolKit.signHash(safeOpHash)
      await chai
        .expect(safeApiKit.confirmSafeOperation(safeOpHash, senderSignature.data))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceBaseUrl}/v1/safe-operations/${safeOpHash}/confirmations/`,
        method: 'post',
        body: {
          signature:
            '0x23e70757bcfe1ccba40588ee3ec8fbca7ff4b51ad48703a598fbe98b935b927d064a98cdcfaf2eff00ae05628ed38f15799a732e143f9fce7215a62fe8e14ff020'
        }
      })
    })
  })

  describe('Custom endpoints', () => {
    const txServiceUrl = 'http://my-custom-tx-service.com/api'
    const queueServiceUrl = 'http://my-custom-queue-service.com/'
    const decoderServiceUrl = 'http://my-custom-decoder-service.com'

    it('should can instantiate the SafeApiKit with custom endpoints', async () => {
      const apiKit = new SafeApiKit({
        chainId,
        txServiceUrl,
        queueServiceUrl,
        decoderServiceUrl
      })

      await chai.expect(apiKit.getServiceInfo()).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${txServiceUrl}/v1/about`,
        method: 'get'
      })

      await chai.expect(apiKit.getTransaction(safeTxHash)).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `http://my-custom-queue-service.com/api/v1/multisig-transactions/${safeTxHash}`,
        method: 'get'
      })

      await chai.expect(apiKit.decodeData('0x12345678')).to.be.fulfilled
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${decoderServiceUrl}/api/v1/data-decoder`,
        method: 'post',
        body: { data: '0x12345678' }
      })
    })
  })
})
