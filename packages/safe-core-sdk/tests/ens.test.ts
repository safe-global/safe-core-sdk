import Web3 from 'web3'
import { ethers } from 'hardhat'
import { Web3Adapter } from '../src'
import { EthersAdapter } from '../dist/src'
import { ZERO_ADDRESS } from '../src/utils/constants'
import chai from 'chai'
import { getDefaultProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import ErrorCodes from '../src/ethereumLibs/exceptions'

describe('Web3Adapter', () => {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby-light.eth.linkpool.io/', {}))
  const web3Adapter = new Web3Adapter({web3, signerAddress: ZERO_ADDRESS})

  describe('ENS direct lookup', () => {
    it('returns an address for ens name', async () => {
      const address = await web3Adapter.ensLookup('loremipsum.eth')
      chai.expect(address).match(/0x[0-9a-z]{40}/i)
    })

    it('throws an error for a non existing name', async () => {
      try {
        await web3Adapter.ensLookup('nonexistingname')
        chai.expect(true).to.be.false
      } catch(error) {
        chai.expect((error as Error).message).to.equal(ErrorCodes._100)
      }
    })
  })

  describe('ENS reverse lookup', () => {
    it('returns a name for existing address', async () => {
      const name = await web3Adapter.ensReverseLookup('0xd8bbcb76bc9aea78972ed4773a5eb67b413f26a5')
      chai.expect(name).to.equal("loremipsum.eth")
    })

    it('throws an error if no name exists for address', async () => {
      try {
        await web3Adapter.ensReverseLookup(ZERO_ADDRESS)
        chai.expect(true).to.be.false
      } catch(error) {
        chai.expect((error as Error).message).to.equal(ErrorCodes._101)
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
      try {
        await ethersAdapter.ensLookup('nonexistingname')
        chai.expect(true).to.be.false
      } catch (error) {
        chai.expect((error as Error).message).to.equal(ErrorCodes._100)
      }
    })
  })

  describe('ENS reverse lookup', () => {
    it('returns a name for existing address', async () => {
      const name = await ethersAdapter.ensReverseLookup('0xd8bbcb76bc9aea78972ed4773a5eb67b413f26a5')
      chai.expect(name).to.equal('loremipsum.eth')
    })

    it('returns null if no name exists for address', async () => {
      try {
        await ethersAdapter.ensReverseLookup(ZERO_ADDRESS)
        chai.expect(true).to.be.false
      } catch (error) {
        chai.expect((error as Error).message).to.equal(ErrorCodes._101)
      }
    })
  })
})