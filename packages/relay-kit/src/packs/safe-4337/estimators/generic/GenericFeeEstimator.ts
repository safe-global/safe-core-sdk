import { EstimateGasData } from '@safe-global/types-kit'
import {
  EstimateFeeFunctionProps,
  IFeeEstimator,
  UserOperationStringValues
} from '@safe-global/relay-kit/packs/safe-4337/types'
import { createPublicClient, http } from 'viem'
import {
  createBundlerClient,
  userOperationToHexValues
} from '@safe-global/relay-kit/packs/safe-4337/utils'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'
import { PaymasterRpcSchema } from './types'

export type GenericFeeEstimatorOverrides = {
  callGasLimit?: bigint
  verificationGasLimit?: bigint
  preVerificationGas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  maxFeePerGasMultiplier?: number
  maxPriorityFeePerGasMultiplier?: number
}

/**
 * GenericFeeEstimator is a class that implements the IFeeEstimator interface. You can implement three optional methods that will be called during the estimation process:
 * - preEstimateUserOperationGas: Setup the userOperation before calling the eth_estimateUserOperation gas method.
 * - postEstimateUserOperationGas: Adjust the userOperation values returned after calling the eth_estimateUserOperation method.
 */
export class GenericFeeEstimator implements IFeeEstimator {
  defaultVerificationGasLimitOverhead?: bigint
  overrides: GenericFeeEstimatorOverrides

  constructor(overrides: GenericFeeEstimatorOverrides = {}) {
    this.defaultVerificationGasLimitOverhead = 55_000n
    this.overrides = overrides
  }

  async preEstimateUserOperationGas({
    bundlerUrl, // eslint-disable-line @typescript-eslint/no-unused-vars
    userOperation,
    entryPoint,
    paymasterOptions,
    nodeUrl,
    chainId
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    bundlerUrl
    if (nodeUrl == null || chainId == null) {
      throw new Error("Can't use GenericFeeEstimator if nodeUrl or chainId is null.")
    }
    if (typeof nodeUrl != 'string') {
      throw new Error("Can't use GenericFeeEstimator if nodeUrl is not a string.")
    }

    let feeDataRes: EstimateGasData = {}
    let paymasterStubDataRes = {}

    if (paymasterOptions) {
      const paymasterClient = createBundlerClient<PaymasterRpcSchema>(paymasterOptions.paymasterUrl)
      const context =
        'paymasterTokenAddress' in paymasterOptions
          ? {
              token: paymasterOptions.paymasterTokenAddress
            }
          : {}

      const [feeData, paymasterStubData] = await Promise.all([
        this.#getUserOperationGasPrices(nodeUrl),
        paymasterClient.request({
          method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA,
          params: [
            userOperationToHexValues(userOperation, entryPoint),
            entryPoint,
            '0x' + chainId.toString(16),
            context
          ]
        })
      ])
      feeDataRes = feeData
      paymasterStubDataRes = paymasterStubData
    } else {
      const feeData = await this.#getUserOperationGasPrices(nodeUrl)
      feeDataRes = feeData
    }

    feeDataRes.callGasLimit = this.overrides.callGasLimit ?? feeDataRes.callGasLimit
    feeDataRes.verificationGasLimit =
      this.overrides.verificationGasLimit ?? feeDataRes.verificationGasLimit
    feeDataRes.preVerificationGas =
      this.overrides.preVerificationGas ?? feeDataRes.preVerificationGas
    feeDataRes.maxFeePerGas = this.overrides.maxFeePerGas ?? feeDataRes.maxFeePerGas
    feeDataRes.maxPriorityFeePerGas =
      this.overrides.maxPriorityFeePerGas ?? feeDataRes.maxPriorityFeePerGas

    return {
      ...feeDataRes,
      ...paymasterStubDataRes
    }
  }

  async postEstimateUserOperationGas({
    userOperation,
    entryPoint,
    paymasterOptions,
    nodeUrl,
    chainId
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (nodeUrl == null || chainId == null) {
      throw new Error("Can't use GenericFeeEstimator if nodeUrl or chainId is null.")
    }

    if (!paymasterOptions) return {}

    const paymasterClient = createBundlerClient<PaymasterRpcSchema>(paymasterOptions.paymasterUrl)
    if (paymasterOptions.isSponsored) {
      const params: [UserOperationStringValues, string, string, { sponsorshipPolicyId: string }?] =
        [
          userOperationToHexValues(userOperation, entryPoint),
          entryPoint,
          '0x' + chainId.toString(16)
        ]

      if (paymasterOptions.sponsorshipPolicyId) {
        params.push({
          sponsorshipPolicyId: paymasterOptions.sponsorshipPolicyId
        })
      }

      const sponsoredData = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
        params
      })

      return sponsoredData
    }

    const erc20PaymasterData = await paymasterClient.request({
      method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
      params: [
        userOperationToHexValues(userOperation, entryPoint),
        entryPoint,
        '0x' + chainId.toString(16),
        { token: paymasterOptions.paymasterTokenAddress }
      ]
    })

    return erc20PaymasterData
  }

  async #getUserOperationGasPrices(
    nodeUrl: string
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const client = createPublicClient({
      transport: http(nodeUrl)
    })
    const [block, maxPriorityFeePerGas] = await Promise.all([
      client.getBlock({ blockTag: 'latest' }),
      client.estimateMaxPriorityFeePerGas()
    ])
    // Base fee from the block (can be undefined for non-EIP1559 blocks)
    const baseFeePerGas = block.baseFeePerGas

    if (!baseFeePerGas) {
      throw new Error('Base fee not available - probably not an EIP-1559 block.')
    }

    // Calculate maxFeePerGas
    const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas
    return {
      maxFeePerGas: BigInt(
        Math.ceil(Number(maxFeePerGas) * (this.overrides.maxFeePerGasMultiplier ?? 1.5))
      ),
      maxPriorityFeePerGas: BigInt(
        Math.ceil(
          Number(maxPriorityFeePerGas) * (this.overrides.maxPriorityFeePerGasMultiplier ?? 1.5)
        )
      )
    }
  }
}
