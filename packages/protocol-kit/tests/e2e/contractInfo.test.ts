import { setupTests } from '@safe-global/testing-kit'
import Safe from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

describe('Contract Info', () => {
  const provider = getEip1193Provider()
  let protocolKit: Safe

  before(async () => {
    const { safe, contractNetworks } = await setupTests()
    const safeAddress = safe.address

    protocolKit = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })
  })

  describe('create', async () => {
    it('should return undefined for a contract address not related to Safe', async () => {
      chai.expect(
        protocolKit.getContractInfo({
          contractAddress: '0x1234567890123456789012345678901234567890'
        })
      ).to.be.undefined
    })

    it('should return the contract info for SafeSingleton contracts', async () => {
      chai
        .expect(
          protocolKit.getContractInfo({
            contractAddress: '0x69f4D1788e39c87893C980c06EdF4b7f686e2938'
          })
        )
        .to.be.deep.equal({
          contractName: 'safeSingletonVersion',
          type: 'eip155',
          version: '1.3.0'
        })

      chai
        .expect(
          protocolKit.getContractInfo({
            contractAddress: '0xb6029EA3B2c51D09a50B53CA8012FeEB05bDa35A'
          })
        )
        .to.be.deep.equal({
          contractName: 'safeSingletonVersion',
          type: 'canonical',
          version: '1.0.0'
        })

      chai
        .expect(
          protocolKit.getContractInfo({
            contractAddress: '0xB00ce5CCcdEf57e539ddcEd01DF43a13855d9910'
          })
        )
        .to.be.deep.equal({
          contractName: 'safeSingletonVersion',
          type: 'zksync',
          version: '1.3.0'
        })
    })

    it('should return the contract info for a CompatibilityFallbackHandler contracts', async () => {
      chai
        .expect(
          protocolKit.getContractInfo({
            contractAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99'
          })
        )
        .to.be.deep.equal({
          contractName: 'compatibilityFallbackHandler',
          type: 'canonical',
          version: '1.4.1'
        })
    })

    it('should return the contract info for a SignMessageLib contracts', async () => {
      chai
        .expect(
          protocolKit.getContractInfo({
            contractAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9'
          })
        )
        .to.be.deep.equal({
          contractName: 'signMessageLibVersion',
          type: 'canonical',
          version: '1.4.1'
        })
    })
  })
})
