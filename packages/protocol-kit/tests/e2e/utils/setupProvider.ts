import hre from 'hardhat'
import { ethers } from 'ethers'
import { custom, createWalletClient, Account } from 'viem'

import { SafeProvider } from '@safe-global/protocol-kit/index'
import { Eip1193Provider } from '@safe-global/protocol-kit/types'

type Network = 'mainnet' | 'gnosis' | 'zksync' | 'goerli' | 'sepolia'

export function getEip1193Provider(): Eip1193Provider {
  switch (process.env.ETH_LIB) {
    case 'viem':
      const client = createWalletClient({
        transport: custom(hre.network.provider)
      })

      return { request: client.request } as Eip1193Provider

    case 'ethers':
      const browserProvider = new ethers.BrowserProvider(hre.network.provider)

      return {
        request: async (request) => {
          return browserProvider.send(request.method, [...((request.params as unknown[]) ?? [])])
        }
      }
    default:
      throw new Error('ETH_LIB not set')
  }
}

export function getSafeProviderFromNetwork(network: Network, account?: Account): SafeProvider {
  let rpcUrl: string
  switch (network) {
    case 'zksync':
      rpcUrl = 'https://mainnet.era.zksync.io'
      break
    case 'gnosis':
      rpcUrl = 'https://rpc.gnosischain.com'
      break
    case 'goerli':
      rpcUrl = 'https://rpc.ankr.com/eth_goerli'
      break
    case 'sepolia':
      rpcUrl = 'https://sepolia.gateway.tenderly.co'
      break
    case 'mainnet':
      rpcUrl = 'https://rpc.ankr.com/eth'
      break
    default:
      throw new Error('Chain not supported')
  }

  return new SafeProvider({ provider: rpcUrl, signer: account?.address })
}
