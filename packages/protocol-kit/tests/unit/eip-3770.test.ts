import chai from 'chai'
import {
  getEip3770NetworkPrefixFromChainId,
  isValidEip3770NetworkPrefix,
  parseEip3770Address,
  validateEip3770Address,
  validateEip3770NetworkPrefix,
  validateEthereumAddress
} from '@safe-global/protocol-kit/utils'

describe('EIP-3770 chain-specific addresses', () => {
  describe('parseEip3770Address', async () => {
    it('should parse an empty full address', async () => {
      const { prefix, address } = parseEip3770Address('')
      chai.expect(prefix).to.be.equal('')
      chai.expect(address).to.be.equal('')
    })

    it('should parse an address', async () => {
      const { prefix, address } = parseEip3770Address('0x123')
      chai.expect(prefix).to.be.equal('')
      chai.expect(address).to.be.equal('0x123')
    })

    it('should parse a full address with empty prefix and empty address', async () => {
      const { prefix, address } = parseEip3770Address(':')
      chai.expect(prefix).to.be.equal('')
      chai.expect(address).to.be.equal('')
    })

    it('should parse a full address with empty address', async () => {
      const { prefix, address } = parseEip3770Address('aaa:')
      chai.expect(prefix).to.be.equal('aaa')
      chai.expect(address).to.be.equal('')
    })

    it('should parse a full address with empty prefix', async () => {
      const { prefix, address } = parseEip3770Address(':0x123')
      chai.expect(prefix).to.be.equal('')
      chai.expect(address).to.be.equal('0x123')
    })

    it('should parse a full address with prefix and address', async () => {
      const { prefix, address } = parseEip3770Address('aaa:0x123')
      chai.expect(prefix).to.be.equal('aaa')
      chai.expect(address).to.be.equal('0x123')
    })
  })

  describe('isValidEip3770NetworkPrefix', async () => {
    it('should return false if prefix is empty', async () => {
      const prefix = ''
      chai.expect(isValidEip3770NetworkPrefix(prefix)).to.be.false
    })

    it('should return false if prefix is not found', async () => {
      const prefix = 'aaa'
      chai.expect(isValidEip3770NetworkPrefix(prefix)).to.be.false
    })

    it('should return false if prefix is invalid', async () => {
      const prefix = 'GOR'
      chai.expect(isValidEip3770NetworkPrefix(prefix)).to.be.false
    })

    it('should return true if prefix is valid', async () => {
      const prefix = 'gor'
      chai.expect(isValidEip3770NetworkPrefix(prefix)).to.be.true
    })
  })

  describe('getEip3770NetworkPrefixFromChainId', async () => {
    it('should fail if chain prefix is not supported', async () => {
      const currentChainId = 0
      chai
        .expect(() => getEip3770NetworkPrefixFromChainId(currentChainId))
        .to.throw('No network prefix supported for the current chainId')
    })

    it('should return network short name from chainId', async () => {
      const currentChainId = 100
      const expectedPrefix = 'gno'
      chai.expect(getEip3770NetworkPrefixFromChainId(currentChainId)).to.be.equal(expectedPrefix)
    })
  })

  describe('validateEip3770NetworkPrefix', async () => {
    it('should fail if current chainId is not supported', async () => {
      const prefix = 'gno'
      const currentChainId = 0
      chai
        .expect(() => validateEip3770NetworkPrefix(prefix, currentChainId))
        .to.throw('No network prefix supported for the current chainId')
    })

    it('should fail if network prefix is not supported', async () => {
      const prefix = 'aaa'
      const currentChainId = 100
      chai
        .expect(() => validateEip3770NetworkPrefix(prefix, currentChainId))
        .to.throw('The network prefix must match the current network')
    })

    it("should fail if prefix doesn't match the current chainId", async () => {
      const prefix = 'gno'
      const currentChainId = 1
      chai
        .expect(() => validateEip3770NetworkPrefix(prefix, currentChainId))
        .to.throw('The network prefix must match the current network')
    })

    it('should pass if prefix and current chainId match', async () => {
      const prefix = 'gno'
      const currentChainId = 100
      validateEip3770NetworkPrefix(prefix, currentChainId)
    })
  })

  describe('validateEthereumAddress', async () => {
    it('should fail if Ethereum address is empty', async () => {
      const address = ''
      chai
        .expect(() => validateEthereumAddress(address))
        .to.throw(`Invalid Ethereum address ${address}`)
    })

    it('should fail if Ethereum address is invalid', async () => {
      const address = '0x123'
      chai
        .expect(() => validateEthereumAddress(address))
        .to.throw(`Invalid Ethereum address ${address}`)
    })

    it('should pass if Ethereum address is valid', async () => {
      const address = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      validateEthereumAddress(address)
    })
  })

  describe('validateEip3770Address', async () => {
    it('should fail validating an empty full address', async () => {
      const testChainId = 100
      const testFullAddress = ''
      chai
        .expect(() => validateEip3770Address(testFullAddress, testChainId))
        .to.throw('Invalid Ethereum address')
    })

    it('should fail validating a full address with empty prefix and empty address', async () => {
      const testChainId = 100
      const testPrefix = ''
      const testAddress = ''
      chai
        .expect(() => validateEip3770Address(`${testPrefix}:${testAddress}`, testChainId))
        .to.throw(`Invalid Ethereum address ${testAddress}`)
    })

    it('should fail validating an invalid address', async () => {
      const testChainId = 100
      const testFullAddress = '0x123'
      chai
        .expect(() => validateEip3770Address(`${testFullAddress}`, testChainId))
        .to.throw(`Invalid Ethereum address ${testFullAddress}`)
    })

    it('should fail validating a full address with invalid prefix', async () => {
      const testChainId = 100
      const testPrefix = 'aaa'
      const testAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      chai
        .expect(() => validateEip3770Address(`${testPrefix}:${testAddress}`, testChainId))
        .to.throw('The network prefix must match the current network')
    })

    it('should fail validating a full address with invalid address', async () => {
      const testChainId = 100
      const testPrefix = 'gno'
      const testAddress = '0x123'
      chai
        .expect(() => validateEip3770Address(`${testPrefix}:${testAddress}`, testChainId))
        .to.throw(`Invalid Ethereum address ${testAddress}`)
    })

    it('should fail validating a full address with address and prefix of different chainId', async () => {
      const testChainId = 100
      const testPrefix = 'gor'
      const testAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      chai
        .expect(() => validateEip3770Address(`${testPrefix}:${testAddress}`, testChainId))
        .to.throw('The network prefix must match the current network')
    })

    it('should fail validating a full address with prefix, address and invalid chainId', async () => {
      const testChainId = 0
      const testPrefix = 'gno'
      const testAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      chai
        .expect(() => validateEip3770Address(`${testPrefix}:${testAddress}`, testChainId))
        .to.throw('No network prefix supported for the current chainId')
    })

    it('should validate an address with no prefix', async () => {
      const testChainId = 100
      const testFullAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      validateEip3770Address(`${testFullAddress}`, testChainId)
    })

    it('should validate a full address with address and prefix of the current chainId', async () => {
      const testChainId = 100
      const testPrefix = 'gno'
      const testAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      const { prefix, address } = validateEip3770Address(
        `${testPrefix}:${testAddress}`,
        testChainId
      )
      chai.expect(prefix).to.be.equal(testPrefix)
      chai.expect(address).to.be.equal(testAddress)
    })
  })
})
