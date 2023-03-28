import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeApiKit from '@safe-global/api-kit/index'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

let safeApiKit: SafeApiKit

describe('getMultisigTransactions', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(
      '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    ))
  })

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(safeApiKit.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205'.toLowerCase()
    await chai
      .expect(safeApiKit.getMultisigTransactions(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty list if there are no multisig transactions', async () => {
    const safeAddress = '0x3e04a375aC5847C690A7f2fF54b45c59f7eeD6f0' // Safe without multisig transactions
    const safeMultisigTransactionListResponse = await safeApiKit.getMultisigTransactions(
      safeAddress
    )
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(0)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(0)
  })

  it('should return the list of multisig transactions', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with multisig transactions
    const safeMultisigTransactionListResponse = await safeApiKit.getMultisigTransactions(
      safeAddress
    )
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(12)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(12)
    safeMultisigTransactionListResponse.results.map((transaction) => {
      chai.expect(transaction.safe).to.be.equal(safeAddress)
    })
  })

  it('should return the list of multisig transactions EIP-3770', async () => {
    const safeAddress = '0x9D1E7371852a9baF631Ea115b9815deb97cC3205' // Safe with multisig transactions
    const eip3770SafeAddress = `${config.EIP_3770_PREFIX}:${safeAddress}`
    const safeMultisigTransactionListResponse = await safeApiKit.getMultisigTransactions(
      eip3770SafeAddress
    )
    chai.expect(safeMultisigTransactionListResponse.count).to.be.equal(12)
    chai.expect(safeMultisigTransactionListResponse.results.length).to.be.equal(12)
    safeMultisigTransactionListResponse.results.map((transaction) => {
      chai.expect(transaction.safe).to.be.equal(safeAddress)
    })
  })
})
