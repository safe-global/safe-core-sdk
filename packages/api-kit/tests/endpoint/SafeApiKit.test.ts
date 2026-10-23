import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'

chai.use(chaiAsPromised)
const { expect } = chai

describe('SafeApiKit', () => {
  const chainId = config.CHAIN_ID
  const customUrls = {
    txServiceUrl: 'https://my-custom-service.example.com',
    queueServiceUrl: 'https://my-custom-queue.example.com',
    decoderServiceUrl: 'https://my-custom-decoder.example.com'
  }

  describe('service URLs with api.safe.global domain', () => {
    it('should throw an error when txServiceUrl contains safe.global and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          txServiceUrl: 'https://api.safe.global/tx-service'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should throw an error when queueServiceUrl contains safe.global and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          queueServiceUrl: 'https://api.safe.global/queue'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should throw an error when decoderServiceUrl contains safe.global and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          decoderServiceUrl: 'https://api.safe.global/decoder'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when the service URLs contain api.safe.global and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.safe.global/tx-service',
          queueServiceUrl: 'https://api.safe.global/queue',
          decoderServiceUrl: 'https://api.safe.global/decoder',
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('service URLs with api.5afe.dev domain', () => {
    it('should throw an error when txServiceUrl contains api.5afe.dev and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          txServiceUrl: 'https://api.5afe.dev/tx-service'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should throw an error when queueServiceUrl contains api.5afe.dev and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          queueServiceUrl: 'https://api.5afe.dev/queue'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when the service URLs contain api.5afe.dev and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.5afe.dev/tx-service',
          queueServiceUrl: 'https://api.5afe.dev/queue',
          decoderServiceUrl: 'https://api.5afe.dev/decoder',
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('service URLs with other domains', () => {
    it('should instantiate successfully when all the service URLs are custom and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls
        })
      }).not.to.throw()
    })

    it('should instantiate successfully when all the service URLs are custom and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          ...customUrls,
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })

    it('should throw an error when only txServiceUrl is custom and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: customUrls.txServiceUrl
        })
      }).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
    })

    it('should throw an error when decoderServiceUrl is not defined and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: customUrls.txServiceUrl,
          queueServiceUrl: customUrls.queueServiceUrl
        })
      }).to.throw('apiKey is mandatory when decoderServiceUrl is not defined')
    })
  })

  describe('no service URLs provided', () => {
    it('should throw an error when txServiceUrl is not provided and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId
        })
      }).to.throw('apiKey is mandatory when txServiceUrl is not defined')
    })

    it('should instantiate successfully when no service URL is provided and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })
})
