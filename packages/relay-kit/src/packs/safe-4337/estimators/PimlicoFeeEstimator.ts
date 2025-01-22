import { EstimateGasData } from '@safe-global/types-kit'
import {
  BundlerClient,
  ERC20PaymasterOption,
  EstimateFeeFunctionProps,
  IFeeEstimator,
  SponsoredPaymasterOption
} from '../types'
import { getEip4337BundlerProvider, userOperationToHexValues } from '../utils'
import { RPC_4337_CALLS } from '../constants'

export class PimlicoFeeEstimator implements IFeeEstimator {
  async setupEstimation({
    bundlerUrl,
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    const bundlerClient = getEip4337BundlerProvider(bundlerUrl)
    const feeData = await this.#getFeeData(bundlerClient)
    const chainId = await bundlerClient.request({ method: 'eth_chainId' })

    let paymasterStubData = {}
    if (paymasterOptions) {
      const paymasterClient = getEip4337BundlerProvider(paymasterOptions.paymasterUrl)
      const context = (paymasterOptions as ERC20PaymasterOption).paymasterTokenAddress
        ? {
            token: (paymasterOptions as ERC20PaymasterOption).paymasterTokenAddress
          }
        : {}
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

  async adjustEstimation({ userOperation }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    return {
      callGasLimit: userOperation.callGasLimit + userOperation.callGasLimit / 2n, // +50%
      verificationGasLimit: userOperation.verificationGasLimit * 4n, // +300%
      preVerificationGas: userOperation.preVerificationGas + userOperation.preVerificationGas / 20n // +5%
    }
  }

  async getPaymasterEstimation({
    userOperation,
    entryPoint,
    paymasterOptions
  }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    if (!paymasterOptions) throw new Error("Paymaster options can't be empty")

    const paymasterClient = getEip4337BundlerProvider(paymasterOptions.paymasterUrl)

    let gasEstimate: EstimateGasData

    if (paymasterOptions?.isSponsored) {
      gasEstimate = await paymasterClient.request({
        method: RPC_4337_CALLS.SPONSOR_USER_OPERATION,
        params: [userOperationToHexValues(userOperation, entryPoint), entryPoint]
      })
    } else {
      const chainId = await paymasterClient.request({ method: 'eth_chainId' })
      gasEstimate = await paymasterClient.request({
        method: RPC_4337_CALLS.GET_PAYMASTER_DATA,
        params: [
          userOperationToHexValues(userOperation, entryPoint),
          entryPoint,
          chainId,
          { token: (paymasterOptions as ERC20PaymasterOption).paymasterTokenAddress }
        ]
      })
    }

    return gasEstimate
  }

  async #getFeeData(
    bundlerClient: BundlerClient
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const feeData = await bundlerClient.request({
      method: 'pimlico_getUserOperationGasPrice'
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
