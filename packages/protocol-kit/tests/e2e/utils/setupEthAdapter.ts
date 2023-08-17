import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import {
  EthersAdapter,
  EthersAdapterConfig,
  Web3Adapter,
  Web3AdapterConfig
} from '@safe-global/protocol-kit/index'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import dotenv from 'dotenv'
import { ethers, web3 } from 'hardhat'
import Web3 from 'web3'

dotenv.config()

type Network = 'mainnet' | 'goerli' | 'gnosis' | 'zksync'

export async function getEthAdapter(
  signerOrProvider: Signer | Provider | Web3
): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress =
        signerOrProvider instanceof Signer ? await signerOrProvider.getAddress() : undefined
      const web3Instance = signerOrProvider instanceof Web3 ? signerOrProvider : (web3 as any)
      const web3AdapterConfig: Web3AdapterConfig = { web3: web3Instance, signerAddress }
      ethAdapter = new Web3Adapter(web3AdapterConfig)
      break
    case 'ethers':
      const ethersAdapterConfig: EthersAdapterConfig = {
        ethers,
        signerOrProvider: signerOrProvider as Provider
      }
      ethAdapter = new EthersAdapter(ethersAdapterConfig)
      break
    default:
      throw new Error('Ethereum library not supported')
  }

  return ethAdapter
}

export function getNetworkProvider(network: Network): Provider | Web3 {
  let rpcUrl: string
  switch (network) {
    case 'zksync':
      rpcUrl = 'https://mainnet.era.zksync.io'
      break
    case 'gnosis':
      rpcUrl = 'https://rpc.gnosischain.com'
      break
    default:
      rpcUrl = `https://${network}.infura.io/v3/${process.env.INFURA_KEY}`
      break
  }

  let provider
  switch (process.env.ETH_LIB) {
    case 'web3':
      provider = new Web3(rpcUrl)
      break
    case 'ethers':
      provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      break
    default:
      throw new Error('Ethereum library not supported')
  }

  return provider
}
