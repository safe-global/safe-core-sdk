import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import { EstimateGasData, EstimateFeeFunctionParams } from '../types'

const alchemySdk = new Alchemy({
  apiKey: '0_Uae8YJ3042uzuMXZ-5-BmJFy85qxKk',
  network: Network.ETH_SEPOLIA
})

export async function alchemy_prepareGasEstimation({
  bundlerUrl
}: EstimateFeeFunctionParams): Promise<EstimateGasData> {
  const bundlerClient = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
    batchMaxCount: 1
  })

  const maxPriorityFeePerGas = await getMaxPriorityFeePerGas(bundlerClient)
  const maxFeePerGas = await getMaxFeePerGas(maxPriorityFeePerGas)

  return {
    maxFeePerGas,
    maxPriorityFeePerGas
  }
}

export async function alchemy_adjustGasEstimation({
  userOperation
}: EstimateFeeFunctionParams): Promise<EstimateGasData> {
  return {
    verificationGasLimit:
      userOperation.verificationGasLimit + userOperation.verificationGasLimit / 2n
  }
}

// Helpers
export const getMaxPriorityFeePerGas = async (
  bundlerClient: ethers.JsonRpcProvider
): Promise<bigint> => {
  const maxPriorityFeePerGas = await bundlerClient.send('rundler_maxPriorityFeePerGas', [])

  const bufferedMaxPriorityFeePerGas =
    BigInt(maxPriorityFeePerGas) + BigInt(maxPriorityFeePerGas) / 2n // Adding a buffer

  return bufferedMaxPriorityFeePerGas
}

export const getMaxFeePerGas = async (maxPriorityFeePerGas: bigint): Promise<bigint> => {
  let maxFeePerGas = 1n

  // Get the latest Block Number
  const latestBlockNum = await alchemySdk.core.getBlockNumber()

  // Get latest Block Details
  const rvBlock = await alchemySdk.core.getBlock(latestBlockNum)
  if (rvBlock && rvBlock.baseFeePerGas) {
    // https://docs.alchemy.com/reference/bundler-api-fee-logic
    maxFeePerGas = BigInt(rvBlock.baseFeePerGas._hex) + maxPriorityFeePerGas
    maxFeePerGas = maxFeePerGas + maxFeePerGas / 2n // Adding a buffer
  }

  return maxFeePerGas
}
