import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit, { DecoderClient, IndexerClient, QueueClient } from '@safe-global/api-kit/index'
import { getTransactionServiceUrl, networks } from '@safe-global/api-kit/utils/config'
import config from '../utils/config'

chai.use(chaiAsPromised)
const { expect } = chai

const API_KEY_HOSTED_ERROR =
  'apiKey is mandatory when using api.safe.global or api.5afe.dev domains'

describe('SafeApiKit', () => {
  const chainId = config.CHAIN_ID
  const indexerUrl = 'https://my-custom-service.example.com/api'
  const customUrls = {
    indexerUrls: [{ chainId, url: indexerUrl }],
    queueServiceUrl: 'https://my-custom-queue.example.com/api',
    decoderServiceUrl: 'https://my-custom-decoder.example.com/api'
  }

  describe('construction', () => {
    it('should not throw without configuration, the services are checked when used', () => {
      expect(() => new SafeApiKit()).not.to.throw()
    })

    it('should create each client once and reuse it', () => {
      const apiKit = new SafeApiKit({ apiKey: 'valid-api-key' })
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
      const apiKit = new SafeApiKit({ indexerUrls: customUrls.indexerUrls })
      expect(() => apiKit.indexer).not.to.throw()
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
      expect(() => apiKit.decoder).to.throw(
        'apiKey is mandatory when decoderServiceUrl is not defined'
      )
    })

    it('should allow using a custom queue without apiKey when the other services are not configured', async () => {
      const apiKit = new SafeApiKit({ queueServiceUrl: customUrls.queueServiceUrl })
      expect(() => apiKit.queue).not.to.throw()
      await expect(apiKit.indexer.getServiceInfo({ chainId })).to.be.rejectedWith(
        `apiKey is mandatory to use the Safe hosted indexer of chainId ${chainId}`
      )
    })

    it('should allow using a custom decoder without apiKey when the other services are not configured', () => {
      const apiKit = new SafeApiKit({ decoderServiceUrl: customUrls.decoderServiceUrl })
      expect(() => apiKit.decoder).not.to.throw()
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
    })

    it('should reject the indexer requests of a chain without hosted Transaction Service nor indexerUrls entry', async () => {
      const apiKit = new SafeApiKit({ apiKey: 'valid-api-key' })
      expect(() => [apiKit.queue, apiKit.decoder, apiKit.indexer]).not.to.throw()
      await expect(apiKit.indexer.getServiceInfo({ chainId: 123456789n })).to.be.rejectedWith(
        'There is no transaction service available for chainId 123456789'
      )
    })
  })

  describe('indexerUrls', () => {
    it('should reject several URLs for the same chain', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [
          { chainId, url: indexerUrl },
          { chainId, url: 'https://other.example.com/api' }
        ]
      })
      expect(() => apiKit.indexer).to.throw(
        `indexerUrls has more than one URL for chainId ${chainId}`
      )
    })

    it('should accept a number or a string chainId, as in a JSON config', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [
          { chainId: Number(chainId), url: indexerUrl },
          { chainId: '1', url: 'https://other.example.com/api' }
        ]
      })
      expect(apiKit.getIndexerUrls()).to.deep.equal([
        { chainId, url: indexerUrl },
        { chainId: 1n, url: 'https://other.example.com/api' }
      ])
    })

    it('should reject the same chain as a number and as a bigint', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [
          { chainId, url: indexerUrl },
          { chainId: Number(chainId), url: 'https://other.example.com/api' }
        ]
      })
      expect(() => apiKit.indexer).to.throw('more than one URL')
    })
  })

  describe('getIndexerUrls', () => {
    it('should return only the indexerUrls entries without apiKey', () => {
      const apiKit = new SafeApiKit({ indexerUrls: [{ chainId, url: `${indexerUrl}/` }] })
      expect(apiKit.getIndexerUrls()).to.deep.equal([{ chainId, url: indexerUrl }])
    })

    it('should add the hosted service of the other chains with apiKey', () => {
      const apiKit = new SafeApiKit({
        apiKey: 'valid-api-key',
        indexerUrls: customUrls.indexerUrls
      })
      const urls = apiKit.getIndexerUrls()
      expect(urls[0]).to.deep.equal({ chainId, url: indexerUrl })
      expect(urls.filter((entry) => entry.chainId === chainId)).to.have.length(1)
      expect(urls).to.deep.include({ chainId: 1n, url: getTransactionServiceUrl(1n) })
      expect(urls).to.have.length(networks.length)
    })

    it('should not let the caller change the configuration', () => {
      const apiKit = new SafeApiKit({ indexerUrls: [{ chainId, url: indexerUrl }] })
      apiKit.getIndexerUrls()[0].url = 'https://changed.example.com/api'
      expect(apiKit.getIndexerUrls()[0].url).to.equal(indexerUrl)
    })

    it('should reject several URLs for the same chain', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [
          { chainId, url: indexerUrl },
          { chainId, url: 'https://other.example.com/api' }
        ]
      })
      expect(() => apiKit.getIndexerUrls()).to.throw('more than one URL')
    })
  })

  describe('service URLs with api.safe.global domain', () => {
    it('should throw when an indexer URL contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        ...customUrls,
        indexerUrls: [{ chainId, url: 'https://api.safe.global/tx-service/sep/api' }]
      })
      expect(() => apiKit.indexer).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.queue).not.to.throw()
    })

    it('should throw when queueServiceUrl contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        ...customUrls,
        queueServiceUrl: 'https://api.safe.global/queue/api'
      })
      expect(() => apiKit.queue).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.indexer).not.to.throw()
    })

    it('should throw when decoderServiceUrl contains safe.global and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        ...customUrls,
        decoderServiceUrl: 'https://api.safe.global/decoder/api'
      })
      expect(() => apiKit.decoder).to.throw(API_KEY_HOSTED_ERROR)
      expect(() => apiKit.queue).not.to.throw()
    })

    it('should create every client when the service URLs contain api.safe.global and apiKey is provided', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [{ chainId, url: 'https://api.safe.global/tx-service/sep/api' }],
        queueServiceUrl: 'https://api.safe.global/queue/api',
        decoderServiceUrl: 'https://api.safe.global/decoder/api',
        apiKey: 'valid-api-key'
      })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('service URLs with api.5afe.dev domain', () => {
    it('should throw when an indexer URL contains api.5afe.dev and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        ...customUrls,
        indexerUrls: [{ chainId, url: 'https://api.5afe.dev/tx-service/sep/api' }]
      })
      expect(() => apiKit.indexer).to.throw(API_KEY_HOSTED_ERROR)
    })

    it('should throw when queueServiceUrl contains api.5afe.dev and apiKey is not provided', () => {
      const apiKit = new SafeApiKit({
        ...customUrls,
        queueServiceUrl: 'https://api.5afe.dev/queue/api'
      })
      expect(() => apiKit.queue).to.throw(API_KEY_HOSTED_ERROR)
    })

    it('should create every client when the service URLs contain api.5afe.dev and apiKey is provided', () => {
      const apiKit = new SafeApiKit({
        indexerUrls: [{ chainId, url: 'https://api.5afe.dev/tx-service/sep/api' }],
        queueServiceUrl: 'https://api.5afe.dev/queue/api',
        decoderServiceUrl: 'https://api.5afe.dev/decoder/api',
        apiKey: 'valid-api-key'
      })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('service URLs with other domains', () => {
    it('should create every client when all the service URLs are custom and apiKey is not provided', () => {
      const apiKit = new SafeApiKit(customUrls)
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })

    it('should create every client when all the service URLs are custom and apiKey is provided', () => {
      const apiKit = new SafeApiKit({ ...customUrls, apiKey: 'valid-api-key' })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })

  describe('no service URLs provided', () => {
    it('should throw when a client is used without apiKey', async () => {
      const apiKit = new SafeApiKit()
      expect(() => apiKit.queue).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
      expect(() => apiKit.decoder).to.throw(
        'apiKey is mandatory when decoderServiceUrl is not defined'
      )
      await expect(apiKit.indexer.getServiceInfo({ chainId })).to.be.rejectedWith(
        `apiKey is mandatory to use the Safe hosted indexer of chainId ${chainId}`
      )
    })

    it('should create every client with the hosted services when apiKey is provided', () => {
      const apiKit = new SafeApiKit({ apiKey: 'valid-api-key' })
      expect(() => [apiKit.indexer, apiKit.queue, apiKit.decoder]).not.to.throw()
    })
  })
})
