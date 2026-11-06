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

  describe('kit without default chain', () => {
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

    it('should take the chain from the EIP-3770 prefix of the address', async () => {
      await apiKit.queue.addMessage(`eth:${safeAddress}`, { message: 'hi', signatures: '0x01' })
      expect(fetchData).to.have.been.calledWith(
        sinon.match({
          url: `${queueUrl}/safes/${safeAddress}/messages`,
          body: sinon.match({ chainId: 1 })
        })
      )
    })

    it('should reject the requests that need a chain when there is none', async () => {
      await expect(
        apiKit.queue.addMessage(safeAddress, { message: 'hi', signatures: '0x01' })
      ).to.be.rejectedWith('chainId is required')
      await expect(apiKit.indexer.getSafeInfo(safeAddress)).to.be.rejectedWith(
        'chainId is required'
      )
    })

    it('should list every chain when there is no chain', async () => {
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

    it('should use the hosted indexer of the chain of each request', async () => {
      await apiKit.indexer.getSafeInfo(safeAddress, { chainId: mainnet })
      expect(fetchData).to.have.been.calledWith({
        url: `${getTransactionServiceUrl(mainnet)}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })

      await apiKit.indexer.getSafeInfo(`sep:${safeAddress}`)
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

  describe('kit with default chain', () => {
    const apiKit = new SafeApiKit({ chainId: sepolia, apiKey })

    it('should use the default chain when the request does not set one', async () => {
      await apiKit.queue.getSafeTransactions(safeAddress)
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/safes/${safeAddress}/multisig-transactions?chainId=11155111`,
        method: 'GET'
      })
    })

    it('should give precedence to the chainId of the request', async () => {
      await apiKit.queue.getSafeTransactions(safeAddress, { chainId: mainnet })
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/safes/${safeAddress}/multisig-transactions?chainId=1`,
        method: 'GET'
      })

      await apiKit.indexer.getSafeInfo(`eth:${safeAddress}`)
      expect(fetchData).to.have.been.calledWith({
        url: `${getTransactionServiceUrl(mainnet)}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })
    })

    it('should reject an EIP-3770 prefix that does not match the chainId of the request', async () => {
      await expect(
        apiKit.queue.getSafeTransactions(`eth:${safeAddress}`, { chainId: sepolia })
      ).to.be.rejectedWith('The network prefix must match the current network')
    })

    it('should create a kit for another chain with forChain', async () => {
      await apiKit.forChain(mainnet).queue.getSafeTransactions(safeAddress)
      expect(fetchData).to.have.been.calledWith({
        url: `${queueUrl}/safes/${safeAddress}/multisig-transactions?chainId=1`,
        method: 'GET'
      })
    })
  })

  describe('custom indexer URL', () => {
    const indexerServiceUrl = 'https://my-custom-service.example.com/api'

    it('should use the custom URL for its chain', async () => {
      const apiKit = new SafeApiKit({ chainId: sepolia, indexerServiceUrl })
      await apiKit.indexer.getSafeInfo(safeAddress)
      expect(fetchData).to.have.been.calledWith({
        url: `${indexerServiceUrl}/v1/safes/${safeAddress}/`,
        method: 'GET'
      })
    })

    it('should reject requests for another chain', async () => {
      const apiKit = new SafeApiKit({ chainId: sepolia, indexerServiceUrl })
      await expect(
        apiKit.indexer.getSafeInfo(safeAddress, { chainId: mainnet })
      ).to.be.rejectedWith(
        `The indexer service at ${indexerServiceUrl} only serves chainId 11155111`
      )
      await expect(apiKit.indexer.getSafeInfo(`eth:${safeAddress}`)).to.be.rejectedWith(
        'only serves chainId 11155111'
      )
    })

    it('should not need a chain when the kit has no default chain', async () => {
      const apiKit = new SafeApiKit({ indexerServiceUrl })
      await apiKit.indexer.getServiceInfo()
      expect(fetchData).to.have.been.calledWith({
        url: `${indexerServiceUrl}/v1/about`,
        method: 'GET'
      })
    })
  })
})
