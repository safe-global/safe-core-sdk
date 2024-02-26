import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import { UserOperation, EstimateGasData } from '../types'
import { RPC_4337_CALLS } from '../constants'

const alchemySdk = new Alchemy({
  apiKey: '0_Uae8YJ3042uzuMXZ-5-BmJFy85qxKk',
  network: Network.ETH_SEPOLIA
})

export async function estimateGasDataWithAlchemy({
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

  const maxPriorityFeePerGas = await getMaxPriorityFeePerGas(bundlerClient)
  const maxFeePerGas = await getMaxFeePerGas(maxPriorityFeePerGas)

  const gasEstimations = await getGasEstimation(
    {
      ...userOperation,
      maxFeePerGas,
      maxPriorityFeePerGas
    },
    entryPoint,
    bundlerClient
  )

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    ...gasEstimations
  }
}

export const getMaxPriorityFeePerGas = async (
  bundlerClient: ethers.JsonRpcProvider
): Promise<bigint> => {
  const maxPriorityFeePerGas = await bundlerClient.send('rundler_maxPriorityFeePerGas', [])

  const bufferedMaxPriorityFeePerGas = (BigInt(maxPriorityFeePerGas) * 13n) / 10n // Adding a buffer

  return bufferedMaxPriorityFeePerGas
}

export const getMaxFeePerGas = async (maxPriorityFeePerGas: bigint): Promise<bigint> => {
  let maxFeePerGas = 1n

  // Get the latest Block Number
  const latestBlockNum = await alchemySdk.core.getBlockNumber()

  // Get latest Block Details
  const rvBlock = await alchemySdk.core.getBlock(latestBlockNum)
  if (rvBlock && rvBlock.baseFeePerGas) {
    maxFeePerGas = ((BigInt(rvBlock.baseFeePerGas._hex) + maxPriorityFeePerGas) * 15n) / 10n // Adding a buffer. Recommended is at least 50%.
    // https://docs.alchemy.com/reference/bundler-api-fee-logic
  }

  return maxFeePerGas
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
