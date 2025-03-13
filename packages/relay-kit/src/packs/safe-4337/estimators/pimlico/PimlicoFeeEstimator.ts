import { EstimateGasData } from '@safe-global/types-kit'
import {
  BundlerClient,
  EstimateFeeFunctionProps,
  IFeeEstimator,
  UserOperationStringValues
} from '@safe-global/relay-kit/packs/safe-4337/types'
import {
  createBundlerClient,
  userOperationToHexValues
} from '@safe-global/relay-kit/packs/safe-4337/utils'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'
import { PIMLICO_CUSTOM_RPC_4337_CALLS, PimlicoCustomRpcSchema } from './types'

/**
 * PimlicoFeeEstimator is a class that implements the IFeeEstimator interface. You can implement three optional methods that will be called during the estimation process:
 * - preEstimateUserOperationGas: Setup the userOperation before calling the eth_estimateUserOperation gas method.
 * - postEstimateUserOperationGas: Adjust the userOperation values returned after calling the eth_estimateUserOperation method.
 */
export class PimlicoFeeEstimator implements IFeeEstimator {
  async preEstimateUserOperationGas({
    bundlerUrl,
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    const bundlerClient = createBundlerClient<PimlicoCustomRpcSchema>(bundlerUrl)
    const feeData = await this.#getUserOperationGasPrices(bundlerClient)
    const chainId = await this.#getChainId(bundlerClient)

    let paymasterStubData = {}

    if (paymasterOptions) {
      const paymasterClient = createBundlerClient<PimlicoCustomRpcSchema>(
        paymasterOptions.paymasterUrl
      )
      const context =
        'paymasterTokenAddress' in paymasterOptions
          ? {
              token: paymasterOptions.paymasterTokenAddress
            }
          : undefined
      paymasterStubData = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA,
        params: [userOperationToHexValues(userOperation, entryPoint), entryPoint, chainId, context]
      })
    }

    return {
      ...feeData,
      ...paymasterStubData
    }
  }

  async postEstimateUserOperationGas({
    bundlerUrl,
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (!paymasterOptions) return {}

    const paymasterClient = createBundlerClient<PimlicoCustomRpcSchema>(
      paymasterOptions.paymasterUrl
    )

    if (paymasterOptions.isSponsored) {
      const params: [UserOperationStringValues, string, { sponsorshipPolicyId: string }?] = [
        userOperationToHexValues(userOperation, entryPoint),
        entryPoint
      ]

      if (paymasterOptions.sponsorshipPolicyId) {
        params.push({
          sponsorshipPolicyId: paymasterOptions.sponsorshipPolicyId
        })
      }

      const sponsoredData = await paymasterClient.request({
        method: PIMLICO_CUSTOM_RPC_4337_CALLS.SPONSOR_USER_OPERATION,
        params
      })

      return sponsoredData
    }

    const bundlerClient = createBundlerClient(
      bundlerUrl
    )
    
    const chainId = await this.#getChainId(bundlerClient)

    const erc20PaymasterData = await paymasterClient.request({
      method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
      params: [
        userOperationToHexValues(userOperation, entryPoint),
        entryPoint,
        chainId,
        { token: paymasterOptions.paymasterTokenAddress }
      ]
    })

    return erc20PaymasterData
  }

  async #getUserOperationGasPrices(
    client: BundlerClient<PimlicoCustomRpcSchema>
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const feeData = await client.request({
      method: PIMLICO_CUSTOM_RPC_4337_CALLS.GET_USER_OPERATION_GAS_PRICE
    })

    const {
      fast: { maxFeePerGas, maxPriorityFeePerGas }
    } = feeData

    return {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    }
  }

  async #getChainId(client: BundlerClient<PimlicoCustomRpcSchema>): Promise<string> {
    const chainId = await client.request({ method: 'eth_chainId' })

    return chainId
  }
}
