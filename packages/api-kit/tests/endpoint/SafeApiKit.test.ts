import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit, { DecoderClient, IndexerClient, QueueClient } from '@safe-global/api-kit/index'
import config from '../utils/config'

chai.use(chaiAsPromised)
const { expect } = chai

const API_KEY_HOSTED_ERROR =
  'apiKey is mandatory when using api.safe.global or api.5afe.dev domains'

describe('SafeApiKit', () => {
  const chainId = config.CHAIN_ID
  const customUrls = {
    indexerServiceUrl: 'https://my-custom-service.example.com/api',
    queueServiceUrl: 'https://my-custom-queue.example.com/api',
    decoderServiceUrl: 'https://my-custom-decoder.example.com/api'
  }

  describe('construction', () => {
    it('should not throw without configuration, the services are checked when used', () => {
      expect(() => new SafeApiKit({ chainId })).not.to.throw()
    })

    it('should create each client once and reuse it', () => {
      const apiKit = new SafeApiKit({ chainId, apiKey: 'valid-api-key' })
      expect(apiKit.queue).to.be.instanceOf(QueueClient)
      expect(apiKit.indexer).to.be.instanceOf(IndexerClient)
      expect(apiKit.decoder).to.be.instanceOf(DecoderClient)
      expect(apiKit.queue).to.equal(apiKit.queue)
      expect(apiKit.indexer).to.equal(apiKit.indexer)
      expect(apiKit.decoder).to.equal(apiKit.decoder)
    })
  })

  describe('services configured independently', () => {
    it('should allow using a custom indexer without apiKey when the other services are not configured', () => {
      const apiKit = new SafeApiKit({ chainId, indexerServiceUrl: customUrls.indexerServiceUrl })
      expect(() => apiKit.indexer).not.to.throw()
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
      expect(() => apiKit.decoder).to.throw(
        'apiKey is mandatory when decoderServiceUrl is not defined'
      )
    })

    it('should allow using a custom queue without apiKey when the other services are not configured', () => {
      const apiKit = new SafeApiKit({ chainId, queueServiceUrl: customUrls.queueServiceUrl })
      expect(() => apiKit.queue).not.to.throw()
      expect(() => apiKit.indexer).to.throw(
        'apiKey is mandatory when indexerServiceUrl is not defined'
      )
    })

    it('should allow using a custom decoder without apiKey when the other services are not configured', () => {
      const apiKit = new SafeApiKit({ chainId, decoderServiceUrl: customUrls.decoderServiceUrl })
      expect(() => apiKit.decoder).not.to.throw()
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
    })

    it('should allow using the queue and the decoder on a chain without hosted Transaction Service', () => {
      const apiKit = new SafeApiKit({ chainId: 123456789n, apiKey: 'valid-api-key' })
      expect(() => apiKit.queue).not.to.throw()
      expect(() => apiKit.decoder).not.to.throw()
      expect(() => apiKit.indexer).to.throw(
        'There is no transaction service available for chainId 123456789'
      )
    })
  })

  describe('indexerServiceUrl and txServiceUrl', () => {
    it('should accept the deprecated txServiceUrl', () => {
      const apiKit = new SafeApiKit({ chainId, txServiceUrl: customUrls.indexerServiceUrl })
      expect(() => apiKit.indexer).not.to.throw()
    })

    it('should give precedence to indexerServiceUrl over txServiceUrl', () => {
      const apiKit = new SafeApiKit({
        chainId,
        indexerServiceUrl: customUrls.indexerServiceUrl,
        txServiceUrl: 'https://api.safe.global/tx-service/sep/api'
      })
      // The hosted txServiceUrl would require an apiKey if it was used
      expect(() => apiKit.indexer).not.to.throw()
    })
  })

  describe('service URLs with api.safe.global domain', () => {
    it('should throw when the indexer URL contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        ...customUrls,
        indexerServiceUrl: 'https://api.safe.global/tx-service/sep/api'
      })
      expect(() => apiKit.indexer).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.queue).not.to.throw()
    })

    it('should throw when the deprecated txServiceUrl contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        txServiceUrl: 'https://api.safe.global/tx-service/sep/api'
      })
      expect(() => apiKit.indexer).to.throw(API_KEY_HOSTED_ERROR)
    })

    it('should throw when queueServiceUrl contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        ...customUrls,
        queueServiceUrl: 'https://api.safe.global/queue/api'
      })
      expect(() => apiKit.queue).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.indexer).not.to.throw()
    })

    it('should throw when decoderServiceUrl contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        ...customUrls,
        decoderServiceUrl: 'https://api.safe.global/decoder/api'
      })
      expect(() => apiKit.decoder).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.queue).not.to.throw()
    })

    it('should create every client when the service URLs contain api.safe.global and apiKey is provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        indexerServiceUrl: 'https://api.safe.global/tx-service/sep/api',
        queueServiceUrl: 'https://api.safe.global/queue/api',
        decoderServiceUrl: 'https://api.safe.global/decoder/api',
        apiKey: 'valid-api-key'
      })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('service URLs with api.5afe.dev domain', () => {
    it('should throw when the indexer URL contains api.5afe.dev and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        ...customUrls,
        indexerServiceUrl: 'https://api.5afe.dev/tx-service/sep/api'
      })
      expect(() => apiKit.indexer).to.throw(API_KEY_HOSTED_ERROR)
    })

    it('should throw when queueServiceUrl contains api.5afe.dev and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        ...customUrls,
        queueServiceUrl: 'https://api.5afe.dev/queue/api'
      })
      expect(() => apiKit.queue).to.throw(API_KEY_HOSTED_ERROR)
    })

    it('should create every client when the service URLs contain api.5afe.dev and apiKey is provided', () => {
      const apiKit = new SafeApiKit({
        chainId,
        indexerServiceUrl: 'https://api.5afe.dev/tx-service/sep/api',
        queueServiceUrl: 'https://api.5afe.dev/queue/api',
        decoderServiceUrl: 'https://api.5afe.dev/decoder/api',
        apiKey: 'valid-api-key'
      })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('service URLs with other domains', () => {
    it('should create every client when all the service URLs are custom and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({ chainId, ...customUrls })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })

    it('should create every client when all the service URLs are custom and apiKey is provided', () => {
      const apiKit = new SafeApiKit({ chainId, ...customUrls, apiKey: 'valid-api-key' })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('no service URLs provided', () => {
    it('should throw when a client is used without apiKey', () => {
      const apiKit = new SafeApiKit({ chainId })
      expect(() => apiKit.indexer).to.throw(
        'apiKey is mandatory when indexerServiceUrl is not defined'
      )
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
      expect(() => apiKit.decoder).to.throw(
        'apiKey is mandatory when decoderServiceUrl is not defined'
      )
    })

    it('should create every client with the hosted services when apiKey is provided', () => {
      const apiKit = new SafeApiKit({ chainId, apiKey: 'valid-api-key' })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })
})
