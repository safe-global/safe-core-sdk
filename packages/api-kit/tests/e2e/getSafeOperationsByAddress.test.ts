import SafeApiKit from '@safe-global/api-kit/index'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'
import { SafeOperationResponse } from 'packages/safe-core-sdk-types/dist/src'

chai.use(chaiAsPromised)

const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // v1.4.1
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

let safeApiKit: SafeApiKit

describe('getSafeOperationsByAddress', () => {
  before(async () => {
    safeApiKit = getApiKit(TX_SERVICE_URL)
  })

  let safeOperations: SafeOperationResponse[]

  describe('should fail', () => {
    it('should fail if safeAddress is empty', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress({ safeAddress: '' }))
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('should fail if safeAddress is invalid', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress({ safeAddress: '0x123' }))
        .to.be.rejectedWith('Invalid Ethereum address 0x123')
    })
  })

  it('should get the SafeOperation list', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress({
      safeAddress: SAFE_ADDRESS
    })

    safeOperations = response.results

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')

    response.results.every((safeOperation) => {
      chai.expect(safeOperation).to.have.property('created')
      chai.expect(safeOperation).to.have.property('modified')
      chai.expect(safeOperation).to.have.property('safeOperationHash')
      chai.expect(safeOperation).to.have.property('validAfter')
      chai.expect(safeOperation).to.have.property('validUntil')
      chai.expect(safeOperation).to.have.property('moduleAddress')
      chai.expect(safeOperation).to.have.property('confirmations').to.be.an('array')
      chai.expect(safeOperation).to.have.property('preparedSignature')
      chai.expect(safeOperation).to.have.property('userOperation')

      chai.expect(safeOperation.userOperation).to.have.property('ethereumTxHash')
      chai.expect(safeOperation.userOperation).to.have.property('sender').to.eq(SAFE_ADDRESS)
      chai.expect(safeOperation.userOperation).to.have.property('userOperationHash')
      chai.expect(safeOperation.userOperation).to.have.property('nonce')
      chai.expect(safeOperation.userOperation).to.have.property('initCode')
      chai.expect(safeOperation.userOperation).to.have.property('callData')
      chai.expect(safeOperation.userOperation).to.have.property('callGasLimit')
      chai.expect(safeOperation.userOperation).to.have.property('verificationGasLimit')
      chai.expect(safeOperation.userOperation).to.have.property('preVerificationGas')
      chai.expect(safeOperation.userOperation).to.have.property('maxFeePerGas')
      chai.expect(safeOperation.userOperation).to.have.property('maxPriorityFeePerGas')
      chai.expect(safeOperation.userOperation).to.have.property('paymaster')
      chai.expect(safeOperation.userOperation).to.have.property('paymasterData')
      chai.expect(safeOperation.userOperation).to.have.property('signature')
      chai.expect(safeOperation.userOperation).to.have.property('entryPoint')
    })
  })

  it('should get a maximum of 3 SafeOperations with limit = 3', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress({
      safeAddress: SAFE_ADDRESS,
      limit: 3
    })

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')
    chai.expect(response.results.length).to.be.lessThanOrEqual(3)
    chai
      .expect(response.results[0].safeOperationHash)
      .to.be.eq('0xfbc38024f74946d9ec31e0c8658dd65e335c6e57c14575250787ec5fb270c08a')
  })

  it('should get all SafeOperations excluding the first one with offset = 1', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress({
      safeAddress: SAFE_ADDRESS,
      offset: 1
    })

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')
    chai.expect(response.results[0].safeOperationHash).to.be.eq(safeOperations[1].safeOperationHash)
  })
})
