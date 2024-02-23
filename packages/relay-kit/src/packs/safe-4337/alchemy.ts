import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'

const alchemySdk = new Alchemy({
  apiKey: '0_Uae8YJ3042uzuMXZ-5-BmJFy85qxKk',
  network: Network.ETH_SEPOLIA
})

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

  console.log('maxFeePerGas', maxFeePerGas)

  return maxFeePerGas
}
