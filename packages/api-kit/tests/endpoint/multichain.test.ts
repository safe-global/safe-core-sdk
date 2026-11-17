import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import SafeApiKit from '@safe-global/api-kit/index'
import * as httpRequests from '@safe-global/api-kit/utils/httpRequests'
import {
  DEFAULT_DECODER_SERVICE_URL,
  DEFAULT_QUEUE_SERVICE_URL,
  getTransactionServiceUrl
} from '@safe-global/api-kit/utils/config'
import { SafeTransactionData } from '@safe-global/types-kit'

chai.use(chaiAsPromised)
chai.use(sinonChai)
const { expect } = chai

const apiKey = 'valid-api-key'
const mainnet = 1n
const sepolia = 11155111n
const safeAddress = '0xF8ef84392f7542576F6b9d1b140334144930Ac78'
const otherSafeAddress = '0x4103eEB76EBBcB652F8B15d3817EBFC07b664b0c'
const contractAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
const queueUrl = `${DEFAULT_QUEUE_SERVICE_URL}/v1`
const decoderUrl = `${DEFAULT_DECODER_SERVICE_URL}/v1`
const OK = { data: { success: true } }

const safeTransactionData = {
  to: safeAddress,
  value: '0',
  data: '0x',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: '0x0000000000000000000000000000000000000000',
  nonce: 0
} as SafeTransactionData

describe('Multi-chain requests', () => {
  let fetchData: sinon.SinonStub

  before(() => {
    fetchData = sinon.stub(httpRequests, 'sendRequest').returns(Promise.resolve(OK))
  })

  after(() => {
    sinon.restore()
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  describe('chain of each request', () => {
    const apiKit = new SafeApiKit({ apiKey })

    it('should use the chainId of each request in the queue', async () => {
      await apiKit.queue.proposeTransaction({
        safeAddress,
        safeTransactionData,
        signatures: '0x01',
        chainId: mainnet
      })
      expect(fetchData).to.have.been.calledWith(
        sinon.match({
          url: `${queueUrl}/multisig-transactions`,
          body: sinon.match({ chainId: 1, safe: safeAddress })
        })
      )
    })

    it('should reject an EIP-3770 prefix that does not match the chainId of the request', async () => {
      await expect(
        apiKit.queue.proposeTransaction({
          safeAddress: `eth:${safeAddress}`,
          safeTransactionData,
          signatures: '0x01',
          chainId: sepolia
        })
      ).to.be.rejectedWith('The network prefix must match the current network')
    })

    it('should take the chain of a read from the EIP-3770 prefix of the address', async () => {
      await apiKit.queue.getSafeTransactions(`eth:${safeAddress}`)
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/safes/${safeAddress}/multisig-transactions?chainId=1`,
        method: 'GET'
      })
    })

    it('should list every chain when a queue read has no chain', async () => {
      await apiKit.queue.getSafeTransactions(safeAddress)
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/safes/${safeAddress}/multisig-transactions`,
        method: 'GET'
      })
    })

    it('should mix Safes of several chains in the pending transactions', async () => {
      await apiKit.queue.getPendingTransactions([`eth:${safeAddress}`, `sep:${otherSafeAddress}`])
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/multisig-transactions/queue?safes=${safeAddress}%3A1&safes=${otherSafeAddress}%3A11155111`,
        method: 'GET'
      })
    })

    it('should reject an EIP-3770 prefix that does not match the chainId of an indexer request', async () => {
      await expect(
        apiKit.indexer.getSafeInfo(`eth:${safeAddress}`, { chainId: sepolia })
      ).to.be.rejectedWith('The network prefix must match the current network')
    })

    it('should use the hosted indexer of the chain of each request', async () => {
      await apiKit.indexer.getSafeInfo(safeAddress, { chainId: mainnet })
      expect(fetchData).to.have.been.calledWith({
        url: `${getTransactionServiceUrl(mainnet)}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })

      await apiKit.indexer.getSafeInfo(`sep:${safeAddress}`, { chainId: sepolia })
      expect(fetchData).to.have.been.calledWith({
        url: `${getTransactionServiceUrl(sepolia)}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })
    })

    it('should send the chainId to the decoder only when there is one', async () => {
      await apiKit.decoder.decodeData('0x1234', contractAddress)
      expect(fetchData).to.have.been.calledWith({
        url: `${decoderUrl}/data-decoder`,
        method: 'POST',
        body: { data: '0x1234', to: contractAddress }
      })

      await apiKit.decoder.decodeData('0x1234', contractAddress, { chainId: mainnet })
      expect(fetchData).to.have.been.calledWith({
        url: `${decoderUrl}/data-decoder`,
        method: 'POST',
        body: { data: '0x1234', to: contractAddress, chainId: 1 }
      })
    })
  })

  describe('indexerUrls', () => {
    const sepoliaIndexer = 'https://my-indexer.example.com/api'
    const customChain = 123456789n
    const customChainIndexer = 'https://my-chain-indexer.example.com/api/'

    const apiKit = new SafeApiKit({
      apiKey,
      indexerUrls: [
        { chainId: sepolia, url: sepoliaIndexer },
        { chainId: customChain, url: customChainIndexer }
      ]
    })

    it('should use the URL of the chain of the request', async () => {
      await apiKit.indexer.getSafeInfo(safeAddress, { chainId: sepolia })
      expect(fetchData).to.have.been.calledWith({
        url: `${sepoliaIndexer}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })

      await apiKit.indexer.getServiceInfo({ chainId: customChain })
      expect(fetchData).to.have.been.calledWith({
        url: 'https://my-chain-indexer.example.com/api/v1/about',
        method: 'GET'
      })
    })

    it('should use the hosted indexer for the chains without URL', async () => {
      await apiKit.indexer.getSafeInfo(`eth:${safeAddress}`, { chainId: mainnet })
      expect(fetchData).to.have.been.calledWith({
        url: `${getTransactionServiceUrl(mainnet)}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })
    })

    it('should not need an apiKey for the chains with URL', async () => {
      const selfHostedKit = new SafeApiKit({
        indexerUrls: [{ chainId: sepolia, url: sepoliaIndexer }]
      })
      await selfHostedKit.indexer.getServiceInfo({ chainId: sepolia })
      expect(fetchData).to.have.been.calledWith({
        url: `${sepoliaIndexer}/v1/about`,
        method: 'GET'
      })
      await expect(selfHostedKit.indexer.getServiceInfo({ chainId: mainnet })).to.be.rejectedWith(
        'apiKey is mandatory to use the Safe hosted indexer of chainId 1'
      )
    })
  })
})
