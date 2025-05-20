import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'

chai.use(chaiAsPromised)
const { expect } = chai

describe('SafeApiKit', () => {
  const chainId = config.CHAIN_ID

  describe('txServiceUrl with api.safe.global domain', () => {
    it('should throw an error when txServiceUrl contains safe.global and txServiceApiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.safe.global/tx-service'
        })
      }).to.throw('txServiceApiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when txServiceUrl contains api.safe.global and txServiceApiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.safe.global/tx-service',
          txServiceApiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('txServiceUrl with api.5afe.dev domain', () => {
    it('should throw an error when txServiceUrl contains api.5afe.dev and txServiceApiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.5afe.dev/tx-service'
        })
      }).to.throw('txServiceApiKey is mandatory when using api.safe.global or api.5afe.dev domains')
    })

    it('should instantiate successfully when txServiceUrl contains api.5afe.dev and txServiceApiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://api.5afe.dev/tx-service',
          txServiceApiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('txServiceUrl with other domains', () => {
    it('should instantiate successfully when txServiceUrl is for a custom domain and txServiceApiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://my-custom-service.example.com'
        })
      }).not.to.throw()
    })

    it('should instantiate successfully when txServiceUrl is for a custom domain and txServiceApiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceUrl: 'https://my-custom-service.example.com',
          txServiceApiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })

  describe('no txServiceUrl provided', () => {
    it('should throw an error when txServiceUrl is not provided and txServiceApiKey is not provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId
        })
      }).to.throw('txServiceApiKey is mandatory when txServiceUrl is not defined')
    })

    it('should instantiate successfully when txServiceUrl is not provided and txServiceApiKey is provided', () => {
      expect(() => {
        new SafeApiKit({
          chainId,
          txServiceApiKey: 'valid-api-key'
        })
      }).not.to.throw()
    })
  })
})
