import { PimlicoFeeEstimator } from './PimlicoFeeEstimator'
import * as fixtures from '../testing-utils/fixtures'
import * as constants from '../constants'

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getEip4337BundlerProvider: () => ({
    request: async ({ method }: { method: string }) => {
      switch (method) {
        case constants.RPC_4337_CALLS.SPONSOR_USER_OPERATION:
          return fixtures.SPONSORED_GAS_ESTIMATION
        case 'pimlico_getUserOperationGasPrice':
          return fixtures.USER_OPERATION_GAS_PRICE
        default:
          return undefined
      }
    }
  })
}))

describe('PimlicoFeeEstimator', () => {
  let estimator: PimlicoFeeEstimator

  beforeEach(() => {
    estimator = new PimlicoFeeEstimator()
  })

  it('should enable to setup the gas estimation', async () => {
    const sponsoredGasEstimation = await estimator.setupEstimation({
      bundlerUrl: fixtures.BUNDLER_URL,
      userOperation: fixtures.USER_OPERATION,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(sponsoredGasEstimation).toEqual({ maxFeePerGas: 100000n, maxPriorityFeePerGas: 200000n })
  })

  it('should enable to adjust the gas estimation', async () => {
    const sponsoredGasEstimation = await estimator.adjustEstimation({
      bundlerUrl: fixtures.BUNDLER_URL,
      userOperation: fixtures.USER_OPERATION,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(sponsoredGasEstimation).toEqual({
      callGasLimit: 181_176n,
      verificationGasLimit: 332_224n,
      preVerificationGas: 50_996n
    })
  })

  it('should get the paymaster estimation', async () => {
    const paymasterGasEstimation = await estimator.getPaymasterEstimation({
      userOperation: fixtures.USER_OPERATION,
      paymasterUrl: fixtures.PAYMASTER_URL,
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(paymasterGasEstimation).toEqual(fixtures.SPONSORED_GAS_ESTIMATION)
  })
})
