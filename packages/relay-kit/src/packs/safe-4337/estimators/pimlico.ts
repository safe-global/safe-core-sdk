import { ethers } from 'ethers'
import { EstimateFeeFunctionParams, EstimateGasData, IFeeEstimator } from '../types'

export class PimlicoFeeEstimator implements IFeeEstimator {
  async prepareGasEstimation({ bundlerUrl }: EstimateFeeFunctionParams): Promise<EstimateGasData> {
    const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
      batchMaxCount: 1
    })

    const feeData = await this.#getFeeData(bundlerClient)

    return feeData
  }

  async adjustGasEstimation({
    userOperation
  }: EstimateFeeFunctionParams): Promise<EstimateGasData> {
    return {
      verificationGasLimit:
        userOperation.verificationGasLimit + userOperation.verificationGasLimit / 2n
    }
  }

  async #getFeeData(
    bundlerClient: ethers.JsonRpcProvider
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const { fast } = await bundlerClient.send('pimlico_getUserOperationGasPrice', [])

    return fast
  }
}
