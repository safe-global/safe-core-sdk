import { PimlicoFeeEstimator } from './PimlicoFeeEstimator'
import { fixtures } from '@safe-global/relay-kit/test-utils'
import { PIMLICO_CUSTOM_RPC_4337_CALLS } from './types'
import { RPC_4337_CALLS } from '../../constants'
import Safe from '@safe-global/protocol-kit'

jest.mock('@safe-global/protocol-kit', () => {
  return jest.fn().mockImplementation(() => ({
    getChainId: jest.fn().mockResolvedValue(parseInt(fixtures.CHAIN_ID, 16))
  }))
})

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
  let mockProtocolKit: jest.Mocked<Safe>

  beforeEach(() => {
    estimator = new PimlicoFeeEstimator()
    mockProtocolKit = new Safe() as jest.Mocked<Safe>
  })

  it('should enable to setup the user operation for gas estimation before calling eth_estimateUserOperationGas', async () => {
    const sponsoredGasEstimation = await estimator.preEstimateUserOperationGas({
      bundlerUrl: fixtures.BUNDLER_URL,
      userOperation: fixtures.USER_OPERATION_V07,
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07,
      protocolKit: mockProtocolKit
    })

    expect(sponsoredGasEstimation).toEqual({
      maxFeePerGas: '0x186A0',
      maxPriorityFeePerGas: '0x30D40'
    })
  })

  it('should enable to adjust the gas estimation after calling eth_estimateUserOperationGas', async () => {
    const paymasterGasEstimation = await estimator.postEstimateUserOperationGas({
      userOperation: fixtures.USER_OPERATION_V07,
      bundlerUrl: fixtures.BUNDLER_URL,
      paymasterOptions: {
        paymasterUrl: fixtures.PAYMASTER_URL,
        paymasterAddress: fixtures.PAYMASTER_ADDRESS,
        paymasterTokenAddress: fixtures.PAYMASTER_TOKEN_ADDRESS
      },
      entryPoint: fixtures.ENTRYPOINT_ADDRESS_V07,
      protocolKit: mockProtocolKit
    })

    expect(paymasterGasEstimation).toEqual(fixtures.SPONSORED_GAS_ESTIMATION)
  })
})
