import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeServiceClient, {
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeCollectiblesOptions,
  SafeDelegate,
  SafeDelegateDelete,
  SafeMultisigTransactionEstimate
} from '../src'
import { getTxServiceBaseUrl } from '../src/utils'
import * as httpRequests from '../src/utils/httpRequests'
chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('Endpoint tests', () => {
  const safeAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
  const ownerAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
  const safeTxHash = '0xede78ed72e9a8afd2b7a21f35c86f56cba5fffb2fff0838e253b7a41d19ceb48'
  const txServiceBaseUrl = 'https://safe-transaction.rinkeby.gnosis.io'
  const serviceSdk = new SafeServiceClient(txServiceBaseUrl)

  const fetchData = sinon
    .stub(httpRequests, 'sendRequest')
    .returns(Promise.resolve({ data: { success: true } }))

  describe('', () => {
    it('getServiceInfo', async () => {
      chai.expect(serviceSdk.getServiceInfo()).to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/about`,
        method: 'get'
      })
    })

    it('getServiceMasterCopiesInfo', async () => {
      chai
        .expect(serviceSdk.getServiceMasterCopiesInfo())
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/about/master-copies`,
        method: 'get'
      })
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      chai.expect(serviceSdk.decodeData(data)).to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/data-decoder/`,
        method: 'post',
        body: { data }
      })
    })

    it('getSafesByOwner', async () => {
      chai
        .expect(serviceSdk.getSafesByOwner(ownerAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/owners/${ownerAddress}/safes/`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      chai
        .expect(serviceSdk.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/multisig-transactions/${safeTxHash}/`,
        method: 'get'
      })
    })

    it('getTransactionConfirmations', async () => {
      chai
        .expect(serviceSdk.getTransactionConfirmations(safeTxHash))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('confirmTransaction', async () => {
      const signature = '0x'
      chai
        .expect(serviceSdk.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('getSafeInfo', async () => {
      chai
        .expect(serviceSdk.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeDelegates', async () => {
      chai
        .expect(serviceSdk.getSafeDelegates(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('addSafeDelegate', async () => {
      const delegate: SafeDelegate = {
        safe: safeAddress,
        delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        signature: '0x',
        label: ''
      }
      chai
        .expect(serviceSdk.addSafeDelegate(safeAddress, delegate))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('removeAllSafeDelegates', async () => {
      chai
        .expect(serviceSdk.removeAllSafeDelegates(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'delete'
      })
    })

    it('removeSafeDelegate', async () => {
      const delegate: SafeDelegateDelete = {
        safe: safeAddress,
        delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        signature: '0x'
      }
      chai
        .expect(serviceSdk.removeSafeDelegate(safeAddress, delegate))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/${
          delegate.delegate
        }`,
        method: 'delete',
        body: delegate
      })
    })

    it('getSafeCreationInfo', async () => {
      chai
        .expect(serviceSdk.getSafeCreationInfo(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/creation/`,
        method: 'get'
      })
    })

    it('estimateSafeTransaction', async () => {
      const safeTransaction: SafeMultisigTransactionEstimate = {
        to: ownerAddress,
        value: '0',
        data: '0x',
        operation: 0
      }
      chai
        .expect(serviceSdk.estimateSafeTransaction(safeAddress, safeTransaction))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/multisig-transactions/estimations/`,
        method: 'post',
        body: safeTransaction
      })
    })

    it('proposeTransaction', async () => {
      const safeTxData: SafeTransactionData = {
        to: '0xa33d2495760462018275994d85117600bd58221e',
        data: '0x',
        value: '123456789',
        operation: 1,
        safeTxGas: 123,
        baseGas: 0,
        gasPrice: 0,
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1
      }
      const signature: SafeSignature = {
        signer: 'signer',
        data: 'signature',
        staticPart: () => '',
        dynamicPart: () => ''
      }
      chai
        .expect(serviceSdk.proposeTransaction(safeAddress, safeTxData, safeTxHash, signature))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTxData,
          contractTransactionHash: safeTxHash,
          sender: signature.signer,
          signature: signature.data
        }
      })
    })

    it('getIncomingTransactions', async () => {
      chai
        .expect(serviceSdk.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getModuleTransactions', async () => {
      chai
        .expect(serviceSdk.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/module-transfers/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions', async () => {
      chai
        .expect(serviceSdk.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`,
        method: 'get'
      })
    })

    it('getPendingTransactions', async () => {
      const currentNonce = 1
      chai
        .expect(serviceSdk.getPendingTransactions(safeAddress, currentNonce))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
        method: 'get'
      })
    })

    it('getBalances', async () => {
      chai
        .expect(serviceSdk.getBalances(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/balances/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getBalances (with options)', async () => {
      const options: SafeBalancesOptions = {
        excludeSpamTokens: false
      }
      chai
        .expect(serviceSdk.getBalances(safeAddress, options))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/balances/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getUsdBalances', async () => {
      chai
        .expect(serviceSdk.getUsdBalances(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/balances/usd/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getUsdBalances (with options)', async () => {
      const options: SafeBalancesUsdOptions = {
        excludeSpamTokens: false
      }
      chai
        .expect(serviceSdk.getUsdBalances(safeAddress, options))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/balances/usd/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getCollectibles', async () => {
      chai
        .expect(serviceSdk.getCollectibles(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/collectibles/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getCollectibles (with options)', async () => {
      const options: SafeCollectiblesOptions = {
        excludeSpamTokens: false
      }
      chai
        .expect(serviceSdk.getCollectibles(safeAddress, options))
        .to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/collectibles/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getTokens', async () => {
      chai.expect(serviceSdk.getTokenList()).to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/tokens/`,
        method: 'get'
      })
    })

    it('getToken', async () => {
      const tokenAddress = '0x'
      chai.expect(serviceSdk.getToken(tokenAddress)).to.be.eventually.deep.equals({ success: true })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })
  })
})
