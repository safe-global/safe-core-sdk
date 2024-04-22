import { ethers } from 'ethers'
import { Safe4337InitOptions } from '../types'
import { Safe4337Pack } from '../Safe4337Pack'
import * as fixtures from './fixtures'

export const generateTransferCallData = (to: string, value: bigint) => {
  const functionAbi = 'function transfer(address _to, uint256 _value) returns (bool)'
  const iface = new ethers.Interface([functionAbi])

  return iface.encodeFunctionData('transfer', [to, value])
}

export const createSafe4337Pack = async (
  initOptions: Partial<Safe4337InitOptions>
): Promise<Safe4337Pack> => {
  const safe4337Pack = await Safe4337Pack.init({
    provider: fixtures.RPC_URL,
    signer: process.env.PRIVATE_KEY,
    options: {
      safeAddress: ''
    },
    ...initOptions,
    rpcUrl: fixtures.RPC_URL,
    bundlerUrl: fixtures.BUNDLER_URL
  })

  return safe4337Pack
}
