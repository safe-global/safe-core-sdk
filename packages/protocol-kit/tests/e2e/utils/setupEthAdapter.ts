import { Provider } from 'ethers'
import { ethers, web3 } from 'hardhat'
import Web3 from 'web3'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { Eip1193Provider } from '@safe-global/protocol-kit/types'
import { SafeProvider } from '@safe-global/protocol-kit/index'

type Network = 'mainnet' | 'gnosis' | 'zksync' | 'goerli' | 'sepolia'

export async function getEip1193Provider(signer: HardhatEthersSigner): Promise<Eip1193Provider> {
  return {
    request: async (request) => {
      return signer.provider.send(request.method, [...((request.params as unknown[]) ?? [])])
    }
  }
}

export function getSafeProviderFromNetwork(
  network: Network,
  signer?: HardhatEthersSigner
): SafeProvider {
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
      rpcUrl = 'https://rpc.ankr.com/eth_sepolia'
      break
    case 'mainnet':
      rpcUrl = 'https://rpc.ankr.com/eth'
      break
    default:
      throw new Error('Chain not supported')
  }

  return new SafeProvider({ providerOrUrl: rpcUrl, signerAddress: signer?.address })
}
