import { ethers } from 'ethers'
import {
  EstimateFeeFunctionProps,
  EstimateGasData,
  EstimateSponsoredFeeFunctionProps,
  EstimateSponsoredGasData,
  IFeeEstimator
} from '../types'
import { userOperationToHexValues } from '../utils'
import { RPC_4337_CALLS } from '../constants'

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
      callGasLimit: userOperation.callGasLimit + userOperation.callGasLimit / 2n,
      verificationGasLimit:
        userOperation.verificationGasLimit + userOperation.verificationGasLimit / 2n
    }
  }

  async getPaymasterEstimation({
    userOperation,
    paymasterUrl,
    entryPoint,
    sponsorshipPolicyId
  }: EstimateSponsoredFeeFunctionProps): Promise<EstimateSponsoredGasData> {
    const paymasterClient = new ethers.JsonRpcProvider(paymasterUrl, undefined, {
      batchMaxCount: 1
    })

    const params = sponsorshipPolicyId
      ? [userOperationToHexValues(userOperation), entryPoint, { sponsorshipPolicyId }]
      : [userOperationToHexValues(userOperation), entryPoint]

    const gasEstimate = await paymasterClient.send(RPC_4337_CALLS.SPONSOR_USER_OPERATION, params)

    return gasEstimate
  }

  async #getFeeData(
    bundlerClient: ethers.JsonRpcProvider
  ): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
    const { fast } = await bundlerClient.send('pimlico_getUserOperationGasPrice', [])

    return fast
  }
}
