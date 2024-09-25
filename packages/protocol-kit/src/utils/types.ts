import { SafeConfig, SafeConfigWithPredictedSafe } from '../types'
import { isHex, Hex, Hash, Chain, defineChain, etherUnits } from 'viem'
import * as allChains from 'viem/chains'

export function isSafeConfigWithPredictedSafe(
  config: SafeConfig
): config is SafeConfigWithPredictedSafe {
  return (config as unknown as SafeConfigWithPredictedSafe).predictedSafe !== undefined
}

export function asHash(hash: string): Hash {
  return hash as Hash
}

export function asHex(hex?: string): Hex {
  return isHex(hex) ? (hex as Hex) : (`0x${hex}` as Hex)
}

export function getChainById(chainId: bigint): Chain | undefined {
  const chain = Object.values(allChains).find((chain) => chain.id === Number(chainId))
  if (chain) {
    return chain
  } else {
    // We assume an ethereum-based chain whose urls will be defined on the client.
    return defineChain({
      id: Number(chainId),
      name: 'Custom',
      nativeCurrency: {
        decimals: etherUnits.wei,
        name: 'Ether',
        symbol: 'ETH'
      },
      rpcUrls: {
        default: {
          http: [],
          webSocket: []
        }
      }
    })
  }
}
