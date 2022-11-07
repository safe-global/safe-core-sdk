import { Signer } from '@ethersproject/abstract-signer'
import { EthAdapter } from '@weichain/safe-core-sdk-types'
import EthersAdapter, { EthersAdapterConfig } from '@weichain/safe-ethers-lib'
import Web3Adapter, { Web3AdapterConfig } from '@weichain/safe-web3-lib'
import { ethers, web3 } from 'hardhat'

export async function getEthAdapter(signer: Signer): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress = await signer.getAddress()
      const web3AdapterConfig: Web3AdapterConfig = { web3: web3 as any, signerAddress }
      ethAdapter = new Web3Adapter(web3AdapterConfig)
      break
    case 'ethers':
      const ethersAdapterConfig: EthersAdapterConfig = { ethers, signer }
      ethAdapter = new EthersAdapter(ethersAdapterConfig)
      break
    default:
      throw new Error('Ethereum library not supported')
  }
  return ethAdapter
}
