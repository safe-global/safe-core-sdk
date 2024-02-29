import { ethers } from 'ethers'
import { EstimateFeeFunctionParams, EstimateGasData } from '../types'

export async function pimlico_prepareGasEstimation({
  bundlerUrl
}: EstimateFeeFunctionParams): Promise<EstimateGasData> {
  const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
    batchMaxCount: 1
  })

  const feeData = await getFeeData(bundlerClient)

  return feeData
}

export async function pimlico_adjustGasEstimation({
  userOperation
}: EstimateFeeFunctionParams): Promise<EstimateGasData> {
  return {
    verificationGasLimit:
      userOperation.verificationGasLimit + userOperation.verificationGasLimit / 2n
  }
}

// Helpers
async function getFeeData(
  bundlerClient: ethers.JsonRpcProvider
): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
  const { fast } = await bundlerClient.send('pimlico_getUserOperationGasPrice', [])

  return fast
}
