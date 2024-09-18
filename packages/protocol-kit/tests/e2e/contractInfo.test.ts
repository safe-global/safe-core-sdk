import { setupTests } from '@safe-global/testing-kit'
import Safe from '@safe-global/protocol-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getEip1193Provider } from './utils/setupProvider'

chai.use(chaiAsPromised)

describe('Contract Info', () => {
  const provider = getEip1193Provider()
  let protocolKit: Safe

  beforeEach(async () => {
    const { safe, contractNetworks } = await setupTests()
    const safeAddress = safe.address
    protocolKit = await Safe.init({
      provider,
      safeAddress,
      contractNetworks
    })
  })

  describe.only('create', async () => {
    it('should return undefined for a contract address not related to Safe', async () => {
      chai.expect(
        protocolKit.getContractInfo({
          contractAddress: '0x1234567890123456789012345678901234567890'
        })
      ).to.be.undefined
    })

    it('should return the contract info for a Safe Singleton contract', async () => {
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
    })
  })
})
