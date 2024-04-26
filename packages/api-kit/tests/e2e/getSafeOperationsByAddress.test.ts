import SafeApiKit from '@safe-global/api-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)

const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // v1.4.1
const SIGNER_PK = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

let safeApiKit: SafeApiKit

describe('getSafeOperationsByAddress', () => {
  before(async () => {
    ;({ safeApiKit } = await getServiceClient(SIGNER_PK, TX_SERVICE_URL))
  })

  describe('should fail', () => {
    it('should fail if safeAddress is empty', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress(''))
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('should fail if safeAddress is invalid', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress('0x123'))
        .to.be.rejectedWith('Invalid Ethereum address 0x123')
    })
  })

  it('should get the SafeOperation list', async () => {
    const safeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)

    chai.expect(safeOperations).to.have.property('count').greaterThan(1)
    chai.expect(safeOperations).to.have.property('results').to.be.an('array')

    safeOperations.results.every((safeOperation) => {
      chai.expect(safeOperation).to.have.property('created')
      chai.expect(safeOperation).to.have.property('modified')
      chai.expect(safeOperation).to.have.property('ethereumTxHash')
      chai.expect(safeOperation).to.have.property('sender').to.eq(SAFE_ADDRESS)
      chai.expect(safeOperation).to.have.property('userOperationHash')
      chai.expect(safeOperation).to.have.property('safeOperationHash')
      chai.expect(safeOperation).to.have.property('nonce')
      chai.expect(safeOperation).to.have.property('initCode')
      chai.expect(safeOperation).to.have.property('callData')
      chai.expect(safeOperation).to.have.property('callDataGasLimit')
      chai.expect(safeOperation).to.have.property('verificationGasLimit')
      chai.expect(safeOperation).to.have.property('preVerificationGas')
      chai.expect(safeOperation).to.have.property('maxFeePerGas')
      chai.expect(safeOperation).to.have.property('maxPriorityFeePerGas')
      chai.expect(safeOperation).to.have.property('paymaster')
      chai.expect(safeOperation).to.have.property('paymasterData')
      chai.expect(safeOperation).to.have.property('signature')
      chai.expect(safeOperation).to.have.property('entryPoint')
      chai.expect(safeOperation).to.have.property('validAfter')
      chai.expect(safeOperation).to.have.property('validUntil')
      chai.expect(safeOperation).to.have.property('moduleAddress')
      chai.expect(safeOperation).to.have.property('confirmations').to.be.an('array')
      chai.expect(safeOperation).to.have.property('preparedSignature')
    })
  })
})
