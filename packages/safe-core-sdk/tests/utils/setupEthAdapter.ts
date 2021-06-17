import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import Web3 from 'web3'
import { EthAdapter, EthersAdapter, Web3Adapter } from '../../src'

export async function getEthAdapter(providerOrSigner?: Provider | Signer): Promise<EthAdapter> {
  console.log(`USING ${process.env.ETH_LIB} AND ${process.env.TEST_NETWORK}`)
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const web3 = new Web3('http://localhost:8545')
      let signerAddress: string | undefined = undefined
      if (providerOrSigner instanceof Signer) {
        signerAddress = await (providerOrSigner as Signer).getAddress()
      }
      console.log({ signerAddress })
      ethAdapter = new Web3Adapter({ web3, signerAddress })
      break
    case 'ethers':
      ethAdapter = new EthersAdapter({ ethers, providerOrSigner })
      break
    default:
      throw new Error('Ethereum library not supported')
  }
  return ethAdapter
}
