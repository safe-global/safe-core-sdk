import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../../utils/config'
import { getApiKit } from '../../utils/setupKits'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

// Safe v1.4.1 singleton, deployed on every chain
const singletonAddress = '0x41675C099F32341bf84BFc5382aF534df5C7461a'

describe('decoder.getContracts', () => {
  before(() => {
    safeApiKit = getApiKit()
  })

  it('should return a paginated list of contracts', async () => {
    const { count, results } = await safeApiKit.decoder.getContracts({ limit: 3 })
    chai.expect(count).to.be.greaterThan(0)
    chai.expect(results.length).to.be.lessThanOrEqual(3)
    chai.expect(results[0]).to.have.property('address')
    chai.expect(results[0]).to.have.property('chainId')
  })

  it('should filter the contracts by chain', async () => {
    const { results } = await safeApiKit.decoder.getContracts({
      chainIds: [config.CHAIN_ID],
      limit: 5
    })
    results.forEach((contract) => {
      chai.expect(contract.chainId).to.be.equal(Number(config.CHAIN_ID))
    })
  })
})

describe('decoder.getContract', () => {
  before(() => {
    safeApiKit = getApiKit()
  })

  it('should fail if the address is empty', async () => {
    await chai
      .expect(safeApiKit.decoder.getContract(''))
      .to.be.rejectedWith('Invalid contract address')
  })

  it('should return the contract on the chain of the kit', async () => {
    const { results } = await safeApiKit.decoder.getContract(singletonAddress, {
      chainIds: [config.CHAIN_ID]
    })
    chai.expect(results.length).to.be.equal(1)
    chai.expect(results[0].address.toLowerCase()).to.be.equal(singletonAddress.toLowerCase())
    chai.expect(results[0].chainId).to.be.equal(Number(config.CHAIN_ID))
  })

  it('should return the contract on several chains', async () => {
    const { count } = await safeApiKit.decoder.getContract(singletonAddress)
    chai.expect(count).to.be.greaterThan(1)
  })
})
