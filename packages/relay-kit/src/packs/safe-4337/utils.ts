import { ethers } from 'ethers'
import { VersionedUserOperation } from '@safe-global/safe-core-sdk-types'

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

  const send = provider.send

  provider.send = async (...args) => {
    const res = await send.call(provider, ...args)
    console.log('args: ', JSON.stringify(args))
    console.log('res: ', res)
    return res
  }

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

  const send = provider.send

  provider.send = async (...args) => {
    const res = await send.call(provider, ...args)
    console.log('args: ', JSON.stringify(args))
    console.log('res: ', res)
    return res
  }

  return provider
}

/**
 * Converts various bigint values from a UserOperation to their hexadecimal representation.
 *
 * @param {UserOperation} userOperation - The UserOperation object whose values are to be converted.
 * @returns {UserOperation} A new UserOperation object with the values converted to hexadecimal.
 */
export function userOperationToHexValues(
  userOperation: VersionedUserOperation['V6'] | VersionedUserOperation['V7']
) {
  const userOperationWithHexValues = {
    ...userOperation,
    nonce: ethers.toBeHex(userOperation.nonce),
    callGasLimit: ethers.toBeHex(userOperation.callGasLimit),
    verificationGasLimit: ethers.toBeHex(userOperation.verificationGasLimit),
    preVerificationGas: ethers.toBeHex(userOperation.preVerificationGas),
    maxFeePerGas: ethers.toBeHex(userOperation.maxFeePerGas),
    maxPriorityFeePerGas: ethers.toBeHex(userOperation.maxPriorityFeePerGas)
  }

  return userOperationWithHexValues
}
