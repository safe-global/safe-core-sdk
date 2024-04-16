import { ethers, web3 } from 'hardhat'
import { Eip1193Provider } from '@safe-global/safe-core-sdk-types'

export function getEip1193Provider(): Eip1193Provider {
  switch (process.env.ETH_LIB) {
    case 'web3':
      return web3.currentProvider as Eip1193Provider
    case 'ethers':
      return {
        request: async (request) => {
          return ethers.provider.send(request.method, [...((request.params as unknown[]) ?? [])])
        }
      }
    default:
      throw new Error('Ethereum library not supported')
  }
}
