import Web3 from 'web3'
import { Web3Adapter } from '../src'
import { ZERO_ADDRESS } from '../src/utils/constants'
import chai from 'chai'

describe.only("Web3Adapter", () => {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby-light.eth.linkpool.io/', {}))
  const web3Adapter = new Web3Adapter({web3, signerAddress: ZERO_ADDRESS})

  describe("ENS direct lookup", () => {
    it("returns an address for ens name", async () => {
      const address = await web3Adapter.ensLookup("safe.eth")

      chai.expect(address).match(/0x[0-9a-z]{40}/i)
    })

    it("throws an error for a non existing name", async () => {
      try {
        await web3Adapter.ensLookup("nonexistingname")
      } catch(error) {
        chai.expect((error as Error).message).to.equal("The resolver at 0x0000000000000000000000000000000000000000does not implement requested method: \"addr\".")
      }
    })
  })

  describe("ENS reverse lookup", () => {
    it("returns a name for existing address", async () => {
      const address = await web3Adapter.ensReverseLookup("0x203aBBf9F190009606C317439360c9f3c0874452")

      chai.expect(address).to.equal("marco.eth")
    })

    it("throws an error if no name exists for address", async () => {
      try {
        await web3Adapter.ensReverseLookup("0x16B110D5b7583266B29159d89eF0d001adf6f6FD")
      } catch(error: any) {
        chai.expect(error.message).to.exist
      }
    })
  })
})