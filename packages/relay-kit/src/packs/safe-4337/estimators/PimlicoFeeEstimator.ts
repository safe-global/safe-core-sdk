import { ethers } from 'ethers'
import { EstimateGasData } from '@safe-global/safe-core-sdk-types'
import {
  EstimateFeeFunctionProps,
  EstimateSponsoredFeeFunctionProps,
  EstimateSponsoredGasData,
  IFeeEstimator
} from '../types'
import { getEip4337BundlerProvider, userOperationToHexValues } from '../utils'
import { RPC_4337_CALLS } from '../constants'

export class PimlicoFeeEstimator implements IFeeEstimator {
  async setupEstimation({ bundlerUrl }: EstimateFeeFunctionProps): Promise<EstimateGasData> {
    const bundlerClient = getEip4337BundlerProvider(bundlerUrl)

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
    const paymasterClient = getEip4337BundlerProvider(paymasterUrl)

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
