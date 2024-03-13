import { ethers } from 'ethers'
import {
  EstimateFeeFunctionProps,
  EstimateGasData,
  EstimateSponsoredFeeFunctionProps,
  EstimateSponsoredGasData,
  IFeeEstimator
} from '../types'
import { userOperationToHexValues } from '../utils'

export class PimlicoFeeEstimator implements IFeeEstimator {
  async setupEstimation({ bundlerUrl }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    const feeData = await this.#getFeeData(bundlerClient)

    return feeData
  }

  async adjustEstimation({ userOperation }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    return {
      verificationGasLimit:
        userOperation.verificationGasLimit + userOperation.verificationGasLimit / 2n
    }
  }

  async getPaymasterEstimation({
    userOperation,
    bundlerUrl,
    entryPoint,
    sponsorshipPolicyId
  }: EstimateSponsoredFeeFunctionProps): Promise<EstimateSponsoredGasData> {
    const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    const params = [userOperationToHexValues(userOperation), entryPoint]

    const gasEstimate = await bundlerClient.send(
      'pm_sponsorUserOperation',
      sponsorshipPolicyId ? [...params, { sponsorshipPolicyId }] : params
    )

    return gasEstimate
  }

  async #getFeeData(
    bundlerClient: ethers.JsonRpcProvider
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const { fast } = await bundlerClient.send('pimlico_getUserOperationGasPrice', [])

    return fast
  }
}
