import { ethers } from 'ethers'
import { EstimateGasData, UserOperation } from '../types'
import { RPC_4337_CALLS } from '../constants'

export async function estimateGasDataWithPimlico({
  bundlerUrl,
  entryPoint,
  userOperation
}: {
  userOperation: UserOperation
  bundlerUrl: string
  entryPoint: string
}): Promise<EstimateGasData> {
  const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
    batchMaxCount: 1
  })

  const feeData = await getFeeData(bundlerClient)
  const gasEstimations = await getGasEstimation(userOperation, entryPoint, bundlerClient)

  return {
    ...feeData,
    ...gasEstimations
  }
}

async function getFeeData(
  bundlerClient: ethers.JsonRpcProvider
): Promise<Pick<EstimateGasData, 'maxFeePerGas' | 'maxPriorityFeePerGas'>> {
  const { fast } = await bundlerClient.send('pimlico_getUserOperationGasPrice', [])

  return fast
}

async function getGasEstimation(
  userOperation: UserOperation,
  entryPointAddress: string,
  bundlerClient: ethers.JsonRpcProvider
): Promise<Pick<EstimateGasData, 'preVerificationGas' | 'verificationGasLimit' | 'callGasLimit'>> {
  const userOperationWithHexValues = {
    ...userOperation,
    nonce: ethers.toBeHex(userOperation.nonce),
    callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
    verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
    preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
    maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
    maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
  }

  const gasEstimation = await bundlerClient.send(RPC_4337_CALLS.ESTIMATE_USER_OPERATION_GAS, [
    userOperationWithHexValues,
    entryPointAddress
  ])

  return {
    ...gasEstimation,
    // Adds an extra amount of gas to the estimations for safety.
    verificationGasLimit: ethers.toBeHex((BigInt(gasEstimation.verificationGasLimit) * 20n) / 10n)
  }
}
