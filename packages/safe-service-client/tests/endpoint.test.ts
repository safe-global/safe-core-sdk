import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import axios from 'axios'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeServiceClient, { SafeDelegate, SafeMultisigTransactionEstimate } from '../src'
import { getTxServiceBaseUrl } from '../src/utils'
chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('Endpoint tests', () => {
  const safeAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
  const ownerAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
  const safeTxHash = '0xede78ed72e9a8afd2b7a21f35c86f56cba5fffb2fff0838e253b7a41d19ceb48'
  const txServiceBaseUrl = 'https://safe-transaction.rinkeby.gnosis.io'
  const serviceSdk = new SafeServiceClient(txServiceBaseUrl)

  const axiosGet = sinon.stub(axios, 'get').resolves({ data: { success: true } })
  const axiosPost = sinon.stub(axios, 'post').resolves({ data: { success: true } })
  const axiosDelete = sinon.stub(axios, 'delete').resolves({ data: { success: true } })

  describe('', () => {
    it('getServiceInfo', async () => {
      chai.expect(serviceSdk.getServiceInfo()).to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(`${getTxServiceBaseUrl(txServiceBaseUrl)}/about`)
    })

    it('getServiceMasterCopiesInfo', async () => {
      chai
        .expect(serviceSdk.getServiceMasterCopiesInfo())
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(`${getTxServiceBaseUrl(txServiceBaseUrl)}/about/master-copies`)
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      chai.expect(serviceSdk.decodeData(data)).to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosPost)
        .to.have.been.calledWith(`${getTxServiceBaseUrl(txServiceBaseUrl)}/data-decoder/`)
    })

    it('getSafesByOwner', async () => {
      chai
        .expect(serviceSdk.getSafesByOwner(ownerAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/owners/${ownerAddress}/safes/`
        )
    })

    it('getTransaction', async () => {
      chai
        .expect(serviceSdk.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/multisig-transactions/${safeTxHash}/`
        )
    })

    it('getTransactionConfirmations', async () => {
      chai
        .expect(serviceSdk.getTransactionConfirmations(safeTxHash))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(
            txServiceBaseUrl
          )}/multisig-transactions/${safeTxHash}/confirmations/`
        )
    })

    it('confirmTransaction', async () => {
      const signature = '0x'
      chai
        .expect(serviceSdk.confirmTransaction(safeTxHash, signature))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosPost)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(
            txServiceBaseUrl
          )}/multisig-transactions/${safeTxHash}/confirmations/`
        )
    })

    it('getSafeInfo', async () => {
      chai
        .expect(serviceSdk.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(`${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/`)
    })

    it('getSafeDelegates', async () => {
      chai
        .expect(serviceSdk.getSafeDelegates(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`
        )
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
      chai
        .expect(axiosPost)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`
        )
    })

    it('removeSafeDelegate', async () => {
      const delegate: SafeDelegate = {
        safe: safeAddress,
        delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        signature: '0x',
        label: ''
      }
      chai
        .expect(serviceSdk.removeSafeDelegate(safeAddress, delegate))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosDelete)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/${
            delegate.delegate
          }`
        )
    })

    it('getSafeCreationInfo', async () => {
      chai
        .expect(serviceSdk.getSafeCreationInfo(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/creation/`
        )
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
      chai
        .expect(axiosPost)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(
            txServiceBaseUrl
          )}/safes/${safeAddress}/multisig-transactions/estimations/`
        )
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
      chai
        .expect(axiosPost)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`
        )
    })

    it('getIncomingTransactions', async () => {
      chai
        .expect(serviceSdk.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/incoming-transfers/`
        )
    })

    it('getModuleTransactions', async () => {
      chai
        .expect(serviceSdk.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/module-transfers/`
        )
    })

    it('getMultisigTransactions', async () => {
      chai
        .expect(serviceSdk.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`
        )
    })

    it('getPendingTransactions', async () => {
      const currentNonce = 1
      chai
        .expect(serviceSdk.getPendingTransactions(safeAddress, currentNonce))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(
            txServiceBaseUrl
          )}/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`
        )
    })

    it('getBalances', async () => {
      chai
        .expect(serviceSdk.getBalances(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/balances/`
        )
    })

    it('getUsdBalances', async () => {
      chai
        .expect(serviceSdk.getUsdBalances(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/balances/usd/`
        )
    })

    it('getCollectibles', async () => {
      chai
        .expect(serviceSdk.getCollectibles(safeAddress))
        .to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/collectibles/`
        )
    })

    it('getTokens', async () => {
      chai.expect(serviceSdk.getTokenList()).to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/balances/usd/`
        )
    })

    it('getToken', async () => {
      const tokenAddress = '0x'
      chai.expect(serviceSdk.getToken(tokenAddress)).to.be.eventually.deep.equals({ success: true })
      chai
        .expect(axiosGet)
        .to.have.been.calledWith(
          `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/collectibles/`
        )
    })
  })
})
