import { PimlicoFeeEstimator } from './PimlicoFeeEstimator'
import * as fixtures from '../../testing-utils/fixtures'
import { PIMLICO_CUSTOM_RPC_4337_CALLS } from './types'
import { RPC_4337_CALLS } from '../../constants'

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  createBundlerClient: () => ({
    request: async ({ method }: { method: string }) => {
      switch (method) {
        case PIMLICO_CUSTOM_RPC_4337_CALLS.SPONSOR_USER_OPERATION:
        case RPC_4337_CALLS.GET_PAYMASTER_DATA:
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
      userOperation: fixtures.USER_OPERATION_V07,
      entryPoint: fixtures.ENTRYPOINTS[1]
    })

    expect(sponsoredGasEstimation).toEqual({
      maxFeePerGas: '0x186A0',
      maxPriorityFeePerGas: '0x30D40'
    })
  })

  it('should enable to adjust the gas estimation', async () => {
    const sponsoredGasEstimation = await estimator.adjustEstimation({
      bundlerUrl: fixtures.BUNDLER_URL,
      userOperation: fixtures.USER_OPERATION_V07,
      entryPoint: fixtures.ENTRYPOINTS[1]
    })

    expect(sponsoredGasEstimation).toEqual({})
  })

  it('should get the paymaster estimation', async () => {
    const paymasterGasEstimation = await estimator.getPaymasterEstimation({
      userOperation: fixtures.USER_OPERATION_V07,
      bundlerUrl: fixtures.BUNDLER_URL,
      paymasterOptions: {
        paymasterUrl: fixtures.PAYMASTER_URL,
        paymasterAddress: fixtures.PAYMASTER_ADDRESS,
        paymasterTokenAddress: fixtures.PAYMASTER_TOKEN_ADDRESS
      },
      entryPoint: fixtures.ENTRYPOINTS[1]
    })

    expect(paymasterGasEstimation).toEqual(fixtures.SPONSORED_GAS_ESTIMATION)
  })
})
