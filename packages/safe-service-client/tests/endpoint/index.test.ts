import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import Safe from '@safe-global/safe-core-sdk'
import { EthAdapter, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeServiceClient, {
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeCollectiblesOptions,
  SafeDelegateConfig,
  SafeDelegateDeleteConfig,
  SafeMultisigTransactionEstimate
} from '../../src'
import { getTxServiceBaseUrl } from '../../src/utils'
import * as httpRequests from '../../src/utils/httpRequests'
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
let serviceSdk: SafeServiceClient

describe('Endpoint tests', () => {
  before(async () => {
    ;({ serviceSdk, ethAdapter } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  const fetchData = sinon
    .stub(httpRequests, 'sendRequest')
    .returns(Promise.resolve({ data: { success: true } }))

  describe('', () => {
    it('getServiceInfo', async () => {
      await chai
        .expect(serviceSdk.getServiceInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/about`,
        method: 'get'
      })
    })

    it('getServiceMasterCopiesInfo', async () => {
      await chai
        .expect(serviceSdk.getServiceMasterCopiesInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/about/master-copies`,
        method: 'get'
      })
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      await chai
        .expect(serviceSdk.decodeData(data))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/data-decoder/`,
        method: 'post',
        body: { data }
      })
    })

    it('getSafesByOwner', async () => {
      await chai
        .expect(serviceSdk.getSafesByOwner(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByOwner EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getSafesByOwner(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/owners/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule', async () => {
      await chai
        .expect(serviceSdk.getSafesByModule(randomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getSafesByModule EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getSafesByModule(eip3770RandomAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/modules/${randomAddress}/safes/`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      await chai
        .expect(serviceSdk.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/multisig-transactions/${safeTxHash}/`,
        method: 'get'
      })
    })

    it('getTransactionConfirmations', async () => {
      await chai
        .expect(serviceSdk.getTransactionConfirmations(safeTxHash))
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
        .expect(serviceSdk.confirmTransaction(safeTxHash, signature))
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
        .expect(serviceSdk.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeInfo EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getSafeInfo(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeDelegates', async () => {
      await chai
        .expect(serviceSdk.getSafeDelegates(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('getSafeDelegates EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getSafeDelegates(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('addSafeDelegate', async () => {
      const delegateConfig: SafeDelegateConfig = {
        safe: safeAddress,
        delegate: delegateAddress,
        signer,
        label: ''
      }
      await chai
        .expect(serviceSdk.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('addSafeDelegate EIP-3770', async () => {
      const delegateConfig: SafeDelegateConfig = {
        safe: eip3770SafeAddress,
        delegate: eip3770DelegateAddress,
        signer,
        label: ''
      }
      await chai
        .expect(serviceSdk.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('removeAllSafeDelegates', async () => {
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = safeAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'delete',
        body: { signature }
      })
    })

    it('removeAllSafeDelegates EIP-3770', async () => {
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = safeAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(serviceSdk.removeAllSafeDelegates(eip3770SafeAddress, signer))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/`,
        method: 'delete',
        body: { signature }
      })
    })

    it('removeSafeDelegate', async () => {
      const delegate = delegateAddress
      const delegateConfig: SafeDelegateDeleteConfig = {
        safe: safeAddress,
        delegate,
        signer
      }
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegate + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(serviceSdk.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/delegates/${
          delegateConfig.delegate
        }`,
        method: 'delete',
        body: {
          safe: delegateConfig.safe,
          delegate: delegateConfig.delegate,
          signature
        }
      })
    })

    it('removeSafeDelegate', async () => {
      const delegate = delegateAddress
      const delegateConfig: SafeDelegateDeleteConfig = {
        safe: eip3770SafeAddress,
        delegate: eip3770DelegateAddress,
        signer
      }
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = delegate + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(serviceSdk.removeSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/delegates/${delegateAddress}`,
        method: 'delete',
        body: {
          safe: safeAddress,
          delegate: delegateAddress,
          signature
        }
      })
    })

    it('getSafeCreationInfo', async () => {
      await chai
        .expect(serviceSdk.getSafeCreationInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/creation/`,
        method: 'get'
      })
    })

    it('getSafeCreationInfo EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getSafeCreationInfo(eip3770SafeAddress))
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
        .expect(serviceSdk.estimateSafeTransaction(safeAddress, safeTransaction))
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
        .expect(serviceSdk.estimateSafeTransaction(eip3770SafeAddress, safeTransaction))
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
      const origin = 'Safe Core SDK: Safe Service Client'
      const signerAddress = await signer.getAddress()
      const safeSdk = await Safe.create({ ethAdapter, safeAddress })
      const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })
      const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
      await chai
        .expect(
          serviceSdk.proposeTransaction({
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
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/multisig-transactions/`,
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
      const origin = 'Safe Core SDK: Safe Service Client'
      const signerAddress = await signer.getAddress()
      const safeSdk = await Safe.create({ ethAdapter, safeAddress })
      const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })
      const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
      await chai
        .expect(
          serviceSdk.proposeTransaction({
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
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/multisig-transactions/`,
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
        .expect(serviceSdk.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getIncomingTransactions EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getIncomingTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getModuleTransactions', async () => {
      await chai
        .expect(serviceSdk.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getModuleTransactions EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getModuleTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/module-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions', async () => {
      await chai
        .expect(serviceSdk.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getMultisigTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      const currentNonce = 1
      await chai
        .expect(serviceSdk.getPendingTransactions(safeAddress, currentNonce))
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
        .expect(serviceSdk.getPendingTransactions(eip3770SafeAddress, currentNonce))
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
        .expect(serviceSdk.getAllTransactions(safeAddress))
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
        .expect(serviceSdk.getAllTransactions(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
        method: 'get'
      })
    })

    it('getBalances', async () => {
      await chai
        .expect(serviceSdk.getBalances(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getBalances EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getBalances(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getBalances (with options)', async () => {
      const options: SafeBalancesOptions = {
        excludeSpamTokens: false
      }
      await chai
        .expect(serviceSdk.getBalances(safeAddress, options))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getUsdBalances', async () => {
      await chai
        .expect(serviceSdk.getUsdBalances(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/usd/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getUsdBalances EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getUsdBalances(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/usd/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getUsdBalances (with options)', async () => {
      const options: SafeBalancesUsdOptions = {
        excludeSpamTokens: false
      }
      await chai
        .expect(serviceSdk.getUsdBalances(safeAddress, options))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v1/safes/${safeAddress}/balances/usd/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getCollectibles', async () => {
      await chai
        .expect(serviceSdk.getCollectibles(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v2/safes/${safeAddress}/collectibles/?limit=10&offset=0&exclude_spam=true`,
        method: 'get'
      })
    })

    it('getCollectibles EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getCollectibles(eip3770SafeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v2/safes/${safeAddress}/collectibles/?limit=10&offset=0&exclude_spam=true`,
        method: 'get'
      })
    })

    it('getCollectibles (with options)', async () => {
      const options: SafeCollectiblesOptions = {
        limit: 2,
        offset: 1,
        excludeSpamTokens: false
      }
      await chai
        .expect(serviceSdk.getCollectibles(safeAddress, options))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/v2/safes/${safeAddress}/collectibles/?limit=2&offset=1&exclude_spam=false`,
        method: 'get'
      })
    })

    it('getTokens', async () => {
      await chai
        .expect(serviceSdk.getTokenList())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/`,
        method: 'get'
      })
    })

    it('getToken', async () => {
      await chai
        .expect(serviceSdk.getToken(tokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })

    it('getToken EIP-3770', async () => {
      await chai
        .expect(serviceSdk.getToken(eip3770TokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/v1/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })
  })
})
