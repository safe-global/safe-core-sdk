import Web3 from 'web3'
import { ethers } from 'hardhat'
import { Web3Adapter } from '../src'
import { EthersAdapter } from '../dist/src'
import { ZERO_ADDRESS } from '../src/utils/constants'
import chai from 'chai'
import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

describe('Web3Adapter', () => {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby-light.eth.linkpool.io/', {}))
  const web3Adapter = new Web3Adapter({web3, signerAddress: ZERO_ADDRESS})

  describe('ENS direct lookup', () => {
    it('returns an address for ens name', async () => {
      const address = await web3Adapter.ensLookup('safe.eth')

      chai.expect(address).match(/0x[0-9a-z]{40}/i)
    })

    it('throws an error for a non existing name', async () => {
      try {
        await web3Adapter.ensLookup('nonexistingname')
      } catch(error) {
        chai.expect((error as Error).message).to.equal('The resolver at 0x0000000000000000000000000000000000000000does not implement requested method: \"addr\".')
      }
    })
  })

  describe('ENS reverse lookup', () => {
    it('returns a name for existing address', async () => {
      const name = await web3Adapter.ensReverseLookup('0x203aBBf9F190009606C317439360c9f3c0874452')
      chai.expect(name).to.equal("marco.eth")
    })

    it('throws an error if no name exists for address', async () => {
      try {
        await web3Adapter.ensReverseLookup('0x16B110D5b7583266B29159d89eF0d001adf6f6FD')
      } catch(error: any) {
        chai.expect(error.message).to.exist
      }
    })
  })
})

describe('EthersAdapter', () => {
  const provider = getDefaultProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`)
  const signer = new Wallet(
    '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', // A Safe owner
    provider
  )
  const ethersAdapter = new EthersAdapter({ ethers, signer })

  describe('ENS direct lookup', () => {
    it('returns an address for ens name', async () => {
      const address = await ethersAdapter.ensLookup('safe.eth')
      chai.expect(address).match(/0x[0-9a-z]{40}/i)
    })

    it('throws an error for a non existing name', async () => {
      const address = await ethersAdapter.ensLookup('nonexistingname')
      chai.expect(address).to.be.null
    })
  })

  describe('ENS reverse lookup', () => {
    it('returns a name for existing address', async () => {
      const name = await ethersAdapter.ensReverseLookup('0x203aBBf9F190009606C317439360c9f3c0874452')
      chai.expect(name).to.equal('marco.eth')
    })

    it('returns null if no name exists for address', async () => {
      const name = await ethersAdapter.ensReverseLookup('0x16B110D5b7583266B29159d89eF0d001adf6f6FD')
      chai.expect(name).to.be.null
    })
  })
})