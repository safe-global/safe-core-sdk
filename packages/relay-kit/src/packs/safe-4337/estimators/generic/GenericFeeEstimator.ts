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

/**
 * GenericFeeEstimator is a class that implements the IFeeEstimator interface. You can implement three optional methods that will be called during the estimation process:
 * - preEstimateUserOperationGas: Setup the userOperation before calling the eth_estimateUserOperation gas method.
 * - postEstimateUserOperationGas: Adjust the userOperation values returned after calling the eth_estimateUserOperation method.
 */
export class GenericFeeEstimator implements IFeeEstimator {
  nodeUrl: string
  chainId: string
  gasMultiplier: number
  constructor(nodeUrl: string, chainId: string, gasMultiplier: number = 1.5) {
    this.nodeUrl = nodeUrl
    this.chainId = chainId
    if (gasMultiplier <= 0) {
      throw new Error("gasMultiplier can't be equal or less than 0.")
    }
    this.gasMultiplier = gasMultiplier
  }

  async preEstimateUserOperationGas({
    bundlerUrl, // eslint-disable-line @typescript-eslint/no-unused-vars
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    bundlerUrl
    if (paymasterOptions) {
      const paymasterClient = createBundlerClient<PaymasterRpcSchema>(paymasterOptions.paymasterUrl)
      const context =
        'paymasterTokenAddress' in paymasterOptions
          ? {
              token: paymasterOptions.paymasterTokenAddress
            }
          : {}

      const [feeData, paymasterStubData] = await Promise.all([
        this.#getUserOperationGasPrices(this.nodeUrl),
        paymasterClient.request({
          method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA,
          params: [
            userOperationToHexValues(userOperation, entryPoint),
            entryPoint,
            this.chainId,
            context
          ]
        })
      ])
      return {
        ...feeData,
        ...paymasterStubData
      }
    } else {
      const feeData = await this.#getUserOperationGasPrices(this.nodeUrl)
      return {
        ...feeData,
        ...{}
      }
    }
  }

  async postEstimateUserOperationGas({
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (!paymasterOptions) return {}

    const paymasterClient = createBundlerClient<PaymasterRpcSchema>(paymasterOptions.paymasterUrl)
    if (paymasterOptions.isSponsored) {
      const params: [UserOperationStringValues, string, string, { sponsorshipPolicyId: string }?] =
        [userOperationToHexValues(userOperation, entryPoint), entryPoint, this.chainId]

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
        this.chainId,
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
      maxFeePerGas: BigInt(Math.ceil(Number(maxFeePerGas) * this.gasMultiplier)),
      maxPriorityFeePerGas: BigInt(Math.ceil(Number(maxPriorityFeePerGas) * this.gasMultiplier))
    }
  }
}
