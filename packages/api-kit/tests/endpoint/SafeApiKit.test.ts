import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'

chai.use(chaiAsPromised)
const { expect } = chai

describe('SafeApiKit', () => {
  const chainId = config.CHAIN_ID

  describe('queueServiceUrl with api.safe.global domain', () => {
    it('should throw an error when queueServiceUrl contains safe.global and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://api.safe.global/queue'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when queueServiceUrl contains api.safe.global and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://api.safe.global/queue',
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('queueServiceUrl with api.5afe.dev domain', () => {
    it('should throw an error when queueServiceUrl contains api.5afe.dev and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://api.5afe.dev/queue'
        })
      }).to.throw('apiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when queueServiceUrl contains api.5afe.dev and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://api.5afe.dev/queue',
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('queueServiceUrl with other domains', () => {
    it('should instantiate successfully when queueServiceUrl is for a custom domain and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://my-custom-service.example.com'
        })
      }).not.to.throw()
    })

    it('should instantiate successfully when queueServiceUrl is for a custom domain and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          queueServiceUrl: 'https://my-custom-service.example.com',
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('no queueServiceUrl provided', () => {
    it('should throw an error when queueServiceUrl is not provided and apiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId
        })
      }).to.throw('apiKey is mandatory when queueServiceUrl is not defined')
    })

    it('should instantiate successfully when queueServiceUrl is not provided and apiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          apiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })
})
