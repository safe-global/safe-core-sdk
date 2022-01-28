import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import Safe from '@gnosis.pm/safe-core-sdk'
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import { EthersAdapter } from '@gnosis.pm/safe-ethers-lib'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import config from '../e2e/config'
import SafeServiceClient, {
  SafeBalancesOptions,
  SafeBalancesUsdOptions,
  SafeCollectiblesOptions,
  SafeDelegateConfig,
  SafeDelegateDeleteConfig,
  SafeMultisigTransactionEstimate
} from '../src'
import { getTxServiceBaseUrl } from '../src/utils'
import * as httpRequests from '../src/utils/httpRequests'
chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('Endpoint tests', () => {
  const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
  const ownerAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
  const safeTxHash = '0xede78ed72e9a8afd2b7a21f35c86f56cba5fffb2fff0838e253b7a41d19ceb48'
  const txServiceBaseUrl = 'https://safe-transaction.rinkeby.gnosis.io'
  const serviceSdk = new SafeServiceClient(txServiceBaseUrl)

  const fetchData = sinon
    .stub(httpRequests, 'sendRequest')
    .returns(Promise.resolve({ data: { success: true } }))

  describe('', () => {
    it('getServiceInfo', async () => {
      await chai
        .expect(serviceSdk.getServiceInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/about`,
        method: 'get'
      })
    })

    it('getServiceMasterCopiesInfo', async () => {
      await chai
        .expect(serviceSdk.getServiceMasterCopiesInfo())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/about/master-copies`,
        method: 'get'
      })
    })

    it('decodeData', async () => {
      const data = '0x610b592500000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      await chai
        .expect(serviceSdk.decodeData(data))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/data-decoder/`,
        method: 'post',
        body: { data }
      })
    })

    it('getSafesByOwner', async () => {
      await chai
        .expect(serviceSdk.getSafesByOwner(ownerAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/owners/${ownerAddress}/safes/`,
        method: 'get'
      })
    })

    it('getTransaction', async () => {
      await chai
        .expect(serviceSdk.getTransaction(safeTxHash))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/multisig-transactions/${safeTxHash}/`,
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
        )}/multisig-transactions/${safeTxHash}/confirmations/`,
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
        )}/multisig-transactions/${safeTxHash}/confirmations/`,
        method: 'get'
      })
    })

    it('getSafeInfo', async () => {
      await chai
        .expect(serviceSdk.getSafeInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/`,
        method: 'get'
      })
    })

    it('getSafeDelegates', async () => {
      await chai
        .expect(serviceSdk.getSafeDelegates(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('addSafeDelegate', async () => {
      const provider = getDefaultProvider(config.JSON_RPC)
      const signer = new Wallet(
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
        provider
      )
      const delegateConfig: SafeDelegateConfig = {
        safe: safeAddress,
        delegate: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
        signer,
        label: ''
      }
      await chai
        .expect(serviceSdk.addSafeDelegate(delegateConfig))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'get'
      })
    })

    it('removeAllSafeDelegates', async () => {
      const provider = getDefaultProvider(config.JSON_RPC)
      const signer = new Wallet(
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
        provider
      )
      const totp = Math.floor(Date.now() / 1000 / 3600)
      const data = safeAddress + totp
      const signature = await signer.signMessage(data)
      await chai
        .expect(serviceSdk.removeAllSafeDelegates(safeAddress, signer))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/`,
        method: 'delete',
        body: { signature }
      })
    })

    it('removeSafeDelegate', async () => {
      const provider = getDefaultProvider(config.JSON_RPC)
      const signer = new Wallet(
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
        provider
      )
      const delegate = '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b'
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
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/delegates/${
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

    it('getSafeCreationInfo', async () => {
      await chai
        .expect(serviceSdk.getSafeCreationInfo(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
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
      await chai
        .expect(serviceSdk.estimateSafeTransaction(safeAddress, safeTransaction))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/multisig-transactions/estimations/`,
        method: 'post',
        body: safeTransaction
      })
    })

    it('proposeTransaction', async () => {
      const safeTxData: SafeTransactionDataPartial = {
        to: '0xa33d2495760462018275994d85117600bd58221e',
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
      const provider = getDefaultProvider(config.JSON_RPC)
      const signer = new Wallet(
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
        provider
      )
      const signerAddress = await signer.getAddress()
      const ethAdapter = new EthersAdapter({ ethers, signer })
      const safeSdk = await Safe.create({ ethAdapter, safeAddress })
      const safeTransaction = await safeSdk.createTransaction(safeTxData)
      await safeSdk.signTransaction(safeTransaction)
      await chai
        .expect(
          serviceSdk.proposeTransaction({
            safeAddress,
            senderAddress: signerAddress,
            safeTransaction,
            safeTxHash,
            origin
          })
        )
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`,
        method: 'post',
        body: {
          ...safeTxData,
          contractTransactionHash: safeTxHash,
          sender: safeTransaction.signatures.get(signerAddress.toLowerCase())?.signer,
          signature: safeTransaction.signatures.get(signerAddress.toLowerCase())?.data,
          origin
        }
      })
    })

    it('getIncomingTransactions', async () => {
      await chai
        .expect(serviceSdk.getIncomingTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/incoming-transfers/`,
        method: 'get'
      })
    })

    it('getModuleTransactions', async () => {
      await chai
        .expect(serviceSdk.getModuleTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/module-transfers/`,
        method: 'get'
      })
    })

    it('getMultisigTransactions', async () => {
      await chai
        .expect(serviceSdk.getMultisigTransactions(safeAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/safes/${safeAddress}/multisig-transactions/`,
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
        )}/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${currentNonce}`,
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
        )}/safes/${safeAddress}/all-transactions/?trusted=true&queued=true&executed=false`,
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
        )}/safes/${safeAddress}/balances/?exclude_spam=true`,
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
        )}/safes/${safeAddress}/balances/?exclude_spam=false`,
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
        )}/safes/${safeAddress}/balances/usd/?exclude_spam=true`,
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
        )}/safes/${safeAddress}/balances/usd/?exclude_spam=false`,
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
        )}/safes/${safeAddress}/collectibles/?exclude_spam=true`,
        method: 'get'
      })
    })

    it('getCollectibles (with options)', async () => {
      const options: SafeCollectiblesOptions = {
        excludeSpamTokens: false
      }
      await chai
        .expect(serviceSdk.getCollectibles(safeAddress, options))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(
          txServiceBaseUrl
        )}/safes/${safeAddress}/collectibles/?exclude_spam=false`,
        method: 'get'
      })
    })

    it('getTokens', async () => {
      await chai
        .expect(serviceSdk.getTokenList())
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/tokens/`,
        method: 'get'
      })
    })

    it('getToken', async () => {
      const tokenAddress = '0x'
      await chai
        .expect(serviceSdk.getToken(tokenAddress))
        .to.be.eventually.deep.equals({ data: { success: true } })
      chai.expect(fetchData).to.have.been.calledWith({
        url: `${getTxServiceBaseUrl(txServiceBaseUrl)}/tokens/${tokenAddress}/`,
        method: 'get'
      })
    })
  })
})
