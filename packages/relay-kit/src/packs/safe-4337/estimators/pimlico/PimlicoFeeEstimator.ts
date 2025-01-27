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
  getEip4337BundlerProvider,
  userOperationToHexValues
} from '@safe-global/relay-kit/packs/safe-4337/utils'
import { RPC_4337_CALLS } from '@safe-global/relay-kit/packs/safe-4337/constants'
import { PIMLICO_CUSTOM_RPC_4337_CALLS, PimlicoCustomRpcSchema } from './types'

export class PimlicoFeeEstimator implements IFeeEstimator {
  async setupEstimation({
    bundlerUrl,
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    const bundlerClient = getEip4337BundlerProvider<PimlicoCustomRpcSchema>(bundlerUrl)
    const feeData = await this.#getFeeData(bundlerClient)
    const chainId = await bundlerClient.request({ method: 'eth_chainId' })

    let paymasterStubData = {}
    if (paymasterOptions) {
      const paymasterClient = getEip4337BundlerProvider<PimlicoCustomRpcSchema>(
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

  async getPaymasterEstimation({
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (!paymasterOptions) throw new Error("Paymaster options can't be empty")

    const paymasterClient = getEip4337BundlerProvider<PimlicoCustomRpcSchema>(
      paymasterOptions.paymasterUrl
    )

    let gasEstimate: EstimateGasData
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
      gasEstimate = await paymasterClient.request({
        method: PIMLICO_CUSTOM_RPC_4337_CALLS.SPONSOR_USER_OPERATION,
        params
      })
    } else {
      const chainId = await paymasterClient.request({ method: 'eth_chainId' })
      gasEstimate = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
        params: [
          userOperationToHexValues(userOperation, entryPoint),
          entryPoint,
          chainId,
          { token: paymasterOptions.paymasterTokenAddress }
        ]
      })
    }

    return gasEstimate
  }

  async #getFeeData(
    bundlerClient: BundlerClient<PimlicoCustomRpcSchema>
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const feeData = await bundlerClient.request({
      method: PIMLICO_CUSTOM_RPC_4337_CALLS.GET_USEROPERATION_GAS_PRICE
    })

    const {
      fast: { maxFeePerGas, maxPriorityFeePerGas }
    } = feeData

    return {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    }
  }
}
