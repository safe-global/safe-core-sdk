import { AbstractSigner, Provider } from 'ethers'
import { EthAdapter } from '@safe-global/safe-core-sdk-types'
import {
  EthersAdapter,
  EthersAdapterConfig,
  Web3Adapter,
  Web3AdapterConfig
} from '@safe-global/protocol-kit'
import { ethers, web3 } from 'hardhat'

export async function getEthAdapter(
  signerOrProvider: AbstractSigner | Provider
): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress =
        signerOrProvider instanceof AbstractSigner ? await signerOrProvider.getAddress() : undefined

      const web3AdapterConfig: Web3AdapterConfig = {
        web3,
        signerAddress
      }

      ethAdapter = new Web3Adapter(web3AdapterConfig)
      break
    case 'ethers':
      const ethersAdapterConfig: EthersAdapterConfig = { ethers, signerOrProvider }
      ethAdapter = new EthersAdapter(ethersAdapterConfig)
      break
    default:
      throw new Error('Ethereum library not supported')
  }
  return ethAdapter
}
