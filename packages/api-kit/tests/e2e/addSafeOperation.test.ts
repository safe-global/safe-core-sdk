import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Wallet, ethers } from 'ethers'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import SafeApiKit from '@safe-global/api-kit'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { generateTransferCallData } from '@safe-global/relay-kit/src/packs/safe-4337/testing-utils/helpers'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'
import { EthersAdapter } from 'packages/protocol-kit'
import { getSafe4337ModuleDeployment } from '@safe-global/safe-modules-deployments'
import config from '../utils/config'
import { getServiceClient } from '../utils/setupServiceClient'

chai.use(chaiAsPromised)
chai.use(sinonChai)

const SIGNER_PK = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // 1/1 Safe (v1.4.1) with signer above as owner + 4337 module enabled
const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const PAYMASTER_ADDRESS = '0x0000000000325602a77416A16136FDafd04b299f'
const BUNDLER_URL = `https://bundler.url`
const TX_SERVICE_URL = 'https://safe-transaction-sepolia.staging.5afe.dev/api'

let safeApiKit: SafeApiKit
let ethAdapter: EthAdapter
let safe4337Pack: Safe4337Pack
let signer: Wallet
let moduleAddress: string

describe('addSafeOperation', () => {
  const transferUSDC = {
    to: PAYMASTER_TOKEN_ADDRESS,
    data: generateTransferCallData(SAFE_ADDRESS, 100_000n),
    value: '0',
    operation: 0
  }

  // Setup mocks for the bundler client
  const providerStub = sinon.stub(ethers.JsonRpcProvider.prototype, 'send')

  providerStub.withArgs(RPC_4337_CALLS.CHAIN_ID, []).returns(Promise.resolve('0xaa36a7'))
  providerStub
    .withArgs(RPC_4337_CALLS.SUPPORTED_ENTRY_POINTS, [])
    .returns(Promise.resolve(['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']))
  providerStub
    .withArgs('pimlico_getUserOperationGasPrice', [])
    .returns(
      Promise.resolve({ fast: { maxFeePerGas: '0x3b9aca00', maxPriorityFeePerGas: '0x3b9aca00' } })
    )

  providerStub.callThrough()

  before(async () => {
    ;({ safeApiKit, ethAdapter, signer } = await getServiceClient(SIGNER_PK, TX_SERVICE_URL))

    const ethersAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })

    safe4337Pack = await Safe4337Pack.init({
      options: { safeAddress: SAFE_ADDRESS },
      ethersAdapter,
      rpcUrl: config.JSON_RPC,
      bundlerUrl: BUNDLER_URL,
      paymasterOptions: {
        paymasterTokenAddress: PAYMASTER_TOKEN_ADDRESS,
        paymasterAddress: PAYMASTER_ADDRESS
      }
    })

    const chainId = (await ethAdapter.getChainId()).toString()

    moduleAddress = getSafe4337ModuleDeployment({
      released: true,
      version: '0.2.0',
      network: chainId
    })?.networkAddresses[chainId] as string
  })

  describe('should fail', () => {
    it('if safeAddress is empty', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            moduleAddress,
            safeAddress: '',
            safeOperation: signedSafeOperation,
            signer
          })
        )
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('if safeAddress is invalid', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            moduleAddress,
            safeAddress: '0x123',
            safeOperation: signedSafeOperation,
            signer
          })
        )
        .to.be.rejectedWith('Invalid Safe address 0x123')
    })

    it('if moduleAddress is empty', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            moduleAddress: '',
            safeAddress: SAFE_ADDRESS,
            safeOperation: signedSafeOperation,
            signer
          })
        )
        .to.be.rejectedWith('Module address must not be empty')
    })

    it('if moduleAddress is invalid', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            moduleAddress: '0x234',
            safeAddress: SAFE_ADDRESS,
            safeOperation: signedSafeOperation,
            signer
          })
        )
        .to.be.rejectedWith('Invalid module address 0x234')
    })

    it('if the SafeOperation is not signed', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            moduleAddress,
            safeAddress: SAFE_ADDRESS,
            safeOperation,
            signer
          })
        )
        .to.be.rejectedWith(
          'SafeOperation is not signed by the given signer 0x56e2C102c664De6DfD7315d12c0178b61D16F171'
        )
    })
  })

  it('should add a new SafeOperation', async () => {
    providerStub.withArgs(RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS, sinon.match.any).returns(
      Promise.resolve({
        preVerificationGas: BigInt(Date.now()),
        callGasLimit: BigInt(Date.now()),
        verificationGasLimit: BigInt(Date.now())
      })
    )

    const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)

    const safeOperationsBefore = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    const initialNumSafeOperations = safeOperationsBefore.results.length

    await chai.expect(
      safeApiKit.addSafeOperation({
        moduleAddress,
        safeAddress: SAFE_ADDRESS,
        safeOperation: signedSafeOperation,
        signer
      })
    ).to.be.fulfilled

    const safeOperationsAfter = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    chai.expect(safeOperationsAfter.results.length).to.equal(initialNumSafeOperations + 1)
  })
})
