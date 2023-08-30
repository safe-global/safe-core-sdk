import { SafeTransactionData, OperationType } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import {
  EIP712_DOMAIN,
  EIP712_DOMAIN_BEFORE_V130,
  generateTypedData,
  getEip712MessageTypes
} from '@safe-global/protocol-kit/utils'

const safeAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
const safeTransactionData: SafeTransactionData = {
  to: '0x000',
  value: '111',
  data: '0x222',
  operation: OperationType.DelegateCall,
  safeTxGas: '444',
  baseGas: '555',
  gasPrice: '666',
  gasToken: '0x777',
  refundReceiver: '0x888',
  nonce: 999
}

describe('EIP-712 sign typed data', () => {
  describe('getEip712MessageTypes', async () => {
    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.0.0', async () => {
      const { EIP712Domain } = getEip712MessageTypes('1.0.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.1.1', async () => {
      const { EIP712Domain } = getEip712MessageTypes('1.1.1')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.2.0', async () => {
      const { EIP712Domain } = getEip712MessageTypes('1.2.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN for Safes >= v1.3.0', async () => {
      const { EIP712Domain } = getEip712MessageTypes('1.3.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN)
    })
  })

  describe('generateTypedData', async () => {
    it('should generate the typed data for Safes == v1.0.0', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.0.0',
        chainId: 4,
        safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for Safes == v1.1.1', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.1.1',
        chainId: 4,
        safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for Safes == v1.2.0', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.2.0',
        chainId: 4,
        safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for for Safes >= v1.3.0', async () => {
      const chainId = 4
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.3.0',
        chainId,
        safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.eq(chainId)
    })
  })
})
