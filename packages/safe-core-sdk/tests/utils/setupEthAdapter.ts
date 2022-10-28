import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import { EthAdapter } from '@gnosis.pm/safe-core-sdk-types'
import EthersAdapter, { EthersAdapterConfig } from '@gnosis.pm/safe-ethers-lib'
import Web3Adapter, { Web3AdapterConfig } from '@gnosis.pm/safe-web3-lib'
import { ethers, web3 } from 'hardhat'

export async function getEthAdapter(signerOrProvider: Signer | Provider): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress = (signerOrProvider instanceof Signer)
        ? await signerOrProvider.getAddress()
        : undefined
      const web3AdapterConfig: Web3AdapterConfig = { web3: web3 as any, signerAddress }
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
