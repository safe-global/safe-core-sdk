import { Provider, AbstractSigner } from 'ethers'
import {
  EthersAdapter,
  EthersAdapterConfig,
  Web3Adapter,
  Web3AdapterConfig
} from '@safe-global/protocol-kit/index'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import dotenv from 'dotenv'
import { ethers, web3, network } from 'hardhat'
import Web3 from 'web3'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { ViemAdapter } from '@safe-global/protocol-kit/adapters/viem/ViemAdapter'
import { Account, createPublicClient, createWalletClient } from 'viem'
import { hardhat } from 'viem/chains'
import { PublicClient, custom, Address } from 'viem'
import { HttpTransport } from 'viem'
import { Chain } from 'viem'
import { WalletClient } from 'viem'

dotenv.config()

type Network = 'mainnet' | 'goerli' | 'gnosis' | 'zksync'

export async function getEthAdapter(
  signerOrProvider: AbstractSigner | Provider | Web3
): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress =
        signerOrProvider instanceof HardhatEthersSigner
          ? await signerOrProvider.getAddress()
          : undefined

      const web3Instance = signerOrProvider instanceof Web3 ? signerOrProvider : web3
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
    case 'viem':
      if (!(signerOrProvider instanceof HardhatEthersSigner)) {
        throw new Error('Viem adapter requires a hardhat signer')
      }

      const client = {
        public: createPublicClient({
          chain: hardhat,
          transport: custom(network.provider)
        }),
        wallet: createWalletClient({
          chain: hardhat,
          account: await signerOrProvider.getAddress().then((a) => a as Address),
          transport: custom(network.provider)
        })
      } as const

      ethAdapter = new ViemAdapter({ client })
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
      provider = new ethers.JsonRpcProvider(rpcUrl)
      break
    default:
      throw new Error('Ethereum library not supported')
  }

  return provider
}
