import { ethers } from 'ethers'

/**
 * Gets the EIP-4337 bundler provider.
 *
 * @param {string} bundlerUrl The EIP-4337 bundler URL.
 * @return {Provider} The EIP-4337 bundler provider.
 */
export function getEip4337BundlerProvider(bundlerUrl: string): ethers.JsonRpcProvider {
  const provider = new ethers.JsonRpcProvider(bundlerUrl, undefined, {
    batchMaxCount: 1
  })

  return provider
}

/**
 * Gets the EIP-1193 provider from the bundler url.
 *
 * @param {string} rpcUrl The RPC URL.
 * @return {Provider} The EIP-1193 provider.
 */
export function getEip1193Provider(rpcUrl: string): ethers.JsonRpcProvider {
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    batchMaxCount: 1
  })

  return provider
}
