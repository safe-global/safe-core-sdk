import { PimlicoFeeEstimator } from './PimlicoFeeEstimator'
import * as fixtures from '../../testing-utils/fixtures'
import { PIMLICO_CUSTOM_RPC_4337_CALLS } from './types'

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  createBundlerClient: () => ({
    request: async ({ method }: { method: string }) => {
      switch (method) {
        case PIMLICO_CUSTOM_RPC_4337_CALLS.SPONSOR_USER_OPERATION:
          return fixtures.SPONSORED_GAS_ESTIMATION
        case PIMLICO_CUSTOM_RPC_4337_CALLS.GET_USER_OPERATION_GAS_PRICE:
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
      bundlerUrl: fixtures.BUNDLER_URL,
      paymasterOptions: {
        paymasterUrl: fixtures.PAYMASTER_URL,
        paymasterAddress: fixtures.PAYMASTER_ADDRESS,
        paymasterTokenAddress: fixtures.PAYMASTER_TOKEN_ADDRESS
      },
      entryPoint: fixtures.ENTRYPOINTS[0]
    })

    expect(paymasterGasEstimation).toEqual(fixtures.SPONSORED_GAS_ESTIMATION)
  })
})
