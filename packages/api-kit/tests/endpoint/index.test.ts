import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import SafeApiKit, {
  AddSafeDelegateProps,
  DeleteSafeDelegateProps,
  SafeMultisigTransactionEstimate
} from '@safe-global/api-kit/index'
import { getTxServiceBaseUrl } from '@safe-global/api-kit/utils'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import Safe from '@safe-global/protocol-kit'
import { EthAdapter, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'
const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
const randomAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
const eip3770RandomAddress = `${config.EIP_3770_PREFIX}:${randomAddress}`
const delegateAddress = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
const eip3770DelegateAddress = `${config.EIP_3770_PREFIX}:${delegateAddress}`
const tokenAddress = '0x210EC22dD6b1c174E5cA1A261DD9791e0755cc6D'
const eip3770TokenAddress = `${config.EIP_3770_PREFIX}:${tokenAddress}`
const safeTxHash = '0xede78ed72e9a8afd2b7a21f35c86f56cba5fffb2fff0838e253b7a41d19ceb48'
const txServiceBaseUrl = 'https://safe-transaction-goerli.safe.global'
const provider = getDefaultProvider(config.JSON_RPC)
const signer = new Wallet(
  '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  provider
)
let ethAdapter: EthAdapter
let safeApiKit: SafeApiKit
let delegatorAddress: string
let eip3770DelegatorAddress: string

describe('Endpoint tests', () => {
  before(async () => {
    ;({ safeApiKit, ethAdapter } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
    delegatorAddress = await signer.getAddress()
    eip3770DelegatorAddress = `${config.EIP_3770_PREFIX}:${delegatorAddress}`
  })

  const fetchData = sinon
    .stub(httpRequests, 'sendRequest')
    .returns(Promise.resolve({ data: { success: true } }))

  describe('', () => {
    it('getServiceInfo', async () => {
      await chai
        .expect(safeApiKit.getServiceInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/about`,
        method: 'get'
      })
    })

    it('getServiceMasterCopiesInfo', async () => {
      await chai
        .expect(safeApiKit.getServiceMasterCopiesInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/about/master-copies`,
        method: 'get'
      })
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      await chai
        .expect(safeApiKit.decodeData(data))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/data-decoder/`,
        method: 'post',
        body: { data }
      })
    })

    it('getSafesByOwner', async () => {
      await chai
        .expect(safeApiKit.getSafesByOwner(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByOwner EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafesByOwner(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule', async () => {
      await chai
        .expect(safeApiKit.getSafesByModule(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafesByModule(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      await chai
        .expect(safeApiKit.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/multisig-transactions/${safeTxHash}/`,
        method: 'get'
      })
    })

    it('getTransactionConfirmations', async () => {
      await chai
        .expect(safeApiKit.getTransactionConfirmations(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('confirmTransaction', async () => {
      const signature = '0x'
      await chai
        .expect(safeApiKit.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('getSafeInfo', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeInfo(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeDelegates', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates?safe=${safeAddress}`,
        method: 'get'
      })
    })

    it('getSafeDelegates EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeDelegates({ safeAddress: eip3770SafeAddress }))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates?safe=${safeAddress}`,
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
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegateAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates/`,
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
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegateAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(safeApiKit.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates/`,
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
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegateAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates/${
          delegateConfig.delegateAddress
        }`,
        method: 'delete',
        body: {
          delegate: delegateAddress,
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
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegateAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(safeApiKit.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/delegates/${delegateAddress}`,
        method: 'delete',
        body: {
          delegate: delegateAddress,
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
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/creation/`,
        method: 'get'
      })
    })

    it('getSafeCreationInfo EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getSafeCreationInfo(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/creation/`,
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
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
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
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/estimations/`,
        method: 'post',
        body: safeTransaction
      })
    })

    it('proposeTransaction', async () => {
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        data: '0x',
        value: '123456789',
        operation: 1,
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1
      }
      const origin = 'Safe Core SDK: Safe API Kit'
      const signerAddress = await signer.getAddress()
      const safeSdk = await Safe.create({ ethAdapter, safeAddress })
      const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })
      const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
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
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTransactionData,
          contractTransactionHash: safeTxHash,
          sender: signerAddress,
          signature: senderSignature.data,
          origin
        }
      })
    })

    it('proposeTransaction EIP-3770', async () => {
      const safeTransactionData: SafeTransactionDataPartial = {
        to: safeAddress,
        data: '0x',
        value: '123456789',
        operation: 1,
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1
      }
      const origin = 'Safe Core SDK: Safe API Kit'
      const signerAddress = await signer.getAddress()
      const safeSdk = await Safe.create({ ethAdapter, safeAddress })
      const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })
      const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
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
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTransactionData,
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
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/incoming-transfers?executed=true`,
        method: 'get'
      })
    })

    it('getIncomingTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getIncomingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/incoming-transfers?executed=true`,
        method: 'get'
      })
    })

    it('getModuleTransactions', async () => {
      await chai
        .expect(safeApiKit.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getModuleTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getModuleTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getMultisigTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      const currentNonce = 1
      await chai
        .expect(safeApiKit.getPendingTransactions(safeAddress, currentNonce))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
        method: 'get'
      })
    })

    it('getPendingTransactions EIP-3770', async () => {
      const currentNonce = 1
      await chai
        .expect(safeApiKit.getPendingTransactions(eip3770SafeAddress, currentNonce))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
        method: 'get'
      })
    })

    it('getAllTransactions', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
        method: 'get'
      })
    })

    it('getAllTransactions EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getAllTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
        method: 'get'
      })
    })

    it('getTokens', async () => {
      await chai
        .expect(safeApiKit.getTokenList())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/`,
        method: 'get'
      })
    })

    it('getToken', async () => {
      await chai
        .expect(safeApiKit.getToken(tokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })

    it('getToken EIP-3770', async () => {
      await chai
        .expect(safeApiKit.getToken(eip3770TokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })
  })
})
