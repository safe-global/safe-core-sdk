import { EstimateGasData } from '@safe-global/types-kit'
import {
  BundlerClient,
  ERC20PaymasterOption,
  EstimateFeeFunctionProps,
  IFeeEstimator,
  SponsoredPaymasterOption,
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
 * - setupEstimation: Setup the userOperation before calling the eth_estimateUserOperation gas method.
 * - adjustEstimation: Adjust the userOperation values returned after calling the eth_adjustUserOperation method.
 * - getPaymasterEstimation: Obtain the paymaster data and the paymaster gas values.
 */
export class PimlicoFeeEstimator implements IFeeEstimator {
  async setupEstimation({
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
      const context = (paymasterOptions as ERC20PaymasterOption).paymasterTokenAddress
        ? {
            token: (paymasterOptions as ERC20PaymasterOption).paymasterTokenAddress
          }
        : undefined
      paymasterStubData = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_STUB_DATA,
        params: (paymasterOptions as SponsoredPaymasterOption).sponsorshipPolicyId
          ? [userOperationToHexValues(userOperation, entryPoint), entryPoint, chainId, context]
          : [userOperationToHexValues(userOperation, entryPoint), entryPoint, chainId, context]
      })
    }

    return {
      ...feeData,
      ...paymasterStubData
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async adjustEstimation(_: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    return {}
  }

  async getPaymasterEstimation({
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (!paymasterOptions)
      throw new Error(
        "Paymaster options can't be empty when trying to get the paymaster data and gas estimation"
      )

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

    const chainId = await this.#getChainId(paymasterClient)

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
    bundlerClient: BundlerClient<PimlicoCustomRpcSchema>
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const feeData = await bundlerClient.request({
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
