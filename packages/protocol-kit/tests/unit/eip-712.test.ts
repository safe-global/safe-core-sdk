import { SafeTransactionData, OperationType } from '@safe-global/safe-core-sdk-types'
import chai from 'chai'
import {
  EIP712_DOMAIN,
  EIP712_DOMAIN_BEFORE_V130,
  generateTypedData,
  getEip712TxTypes
} from '@safe-global/protocol-kit/utils'
import { EIP712TypedData } from '@safe-global/safe-core-sdk-types'

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
  describe('getEip712TxTypes', async () => {
    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.0.0', async () => {
      const { EIP712Domain } = getEip712TxTypes('1.0.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.1.1', async () => {
      const { EIP712Domain } = getEip712TxTypes('1.1.1')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN_BEFORE_V130 for Safes == v1.2.0', async () => {
      const { EIP712Domain } = getEip712TxTypes('1.2.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN_BEFORE_V130)
    })

    it('should have the domain typed as EIP712_DOMAIN for Safes >= v1.3.0', async () => {
      const { EIP712Domain } = getEip712TxTypes('1.3.0')
      chai.expect(EIP712Domain).to.be.eq(EIP712_DOMAIN)
    })
  })

  describe('generateTypedData', async () => {
    it('should generate the typed data for Safes == v1.0.0', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.0.0',
        chainId: 4n,
        data: safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for Safes == v1.1.1', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.1.1',
        chainId: 4n,
        data: safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for Safes == v1.2.0', async () => {
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.2.0',
        chainId: 4n,
        data: safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.undefined
    })

    it('should generate the typed data for for Safes >= v1.3.0', async () => {
      const chainId = 4n
      const { domain } = generateTypedData({
        safeAddress,
        safeVersion: '1.3.0',
        chainId,
        data: safeTransactionData
      })
      chai.expect(domain.verifyingContract).to.be.eq(safeAddress)
      chai.expect(domain.chainId).to.be.eq(Number(chainId))
    })

    it('should generate the correct types for a EIP-191 message for >= 1.3.0 Safes', () => {
      const message = 'Hello world!'

      const safeMessage = generateTypedData({
        safeAddress,
        safeVersion: '1.3.0',
        chainId: 1n,
        data: message
      })

      chai.expect(safeMessage).to.deep.eq({
        types: {
          EIP712Domain: [
            {
              name: 'chainId',
              type: 'uint256'
            },
            {
              name: 'verifyingContract',
              type: 'address'
            }
          ],
          SafeMessage: [{ name: 'message', type: 'bytes' }]
        },
        domain: {
          chainId: 1,
          verifyingContract: safeAddress
        },
        primaryType: 'SafeMessage',
        message: {
          message: '0xaa05af77f274774b8bdc7b61d98bc40da523dc2821fdea555f4d6aa413199bcc'
        }
      })
    })

    it('should generate the correct types for a EIP-191 message for < 1.3.0 Safes', () => {
      const message = 'Hello world!'

      const safeMessage = generateTypedData({
        safeAddress,
        safeVersion: '1.1.1',
        chainId: 1n,
        data: message
      })

      chai.expect(safeMessage).to.deep.eq({
        types: {
          EIP712Domain: [
            {
              name: 'verifyingContract',
              type: 'address'
            }
          ],
          SafeMessage: [{ name: 'message', type: 'bytes' }]
        },
        domain: {
          verifyingContract: safeAddress
        },
        primaryType: 'SafeMessage',
        message: {
          message: '0xaa05af77f274774b8bdc7b61d98bc40da523dc2821fdea555f4d6aa413199bcc'
        }
      })
    })

    it('should generate the correct types for an EIP-712 message for >=1.3.0 Safes', () => {
      const message: EIP712TypedData = {
        domain: {
          chainId: 1,
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1'
        },
        message: {
          contents: 'Hello, Bob!',
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
          }
        },
        primaryType: 'Mail',
        types: {
          Mail: [
            {
              name: 'from',
              type: 'Person'
            },
            {
              name: 'to',
              type: 'Person'
            },
            {
              name: 'contents',
              type: 'string'
            }
          ],
          Person: [
            {
              name: 'name',
              type: 'string'
            },
            {
              name: 'wallet',
              type: 'address'
            }
          ]
        }
      }

      const safeMessage = generateTypedData({
        safeAddress,
        safeVersion: '1.3.0',
        chainId: 1n,
        data: message
      })

      chai.expect(safeMessage).to.deep.eq({
        types: {
          EIP712Domain: [
            {
              name: 'chainId',
              type: 'uint256'
            },
            {
              name: 'verifyingContract',
              type: 'address'
            }
          ],
          SafeMessage: [{ name: 'message', type: 'bytes' }]
        },
        domain: {
          chainId: 1,
          verifyingContract: safeAddress
        },
        primaryType: 'SafeMessage',
        message: {
          message: '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2'
        }
      })
    })

    it('should generate the correct types for an EIP-712 message for <1.3.0 Safes', () => {
      const message = {
        domain: {
          chainId: 1,
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1'
        },
        message: {
          contents: 'Hello, Bob!',
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
          }
        },
        primaryType: 'Mail',
        types: {
          Mail: [
            {
              name: 'from',
              type: 'Person'
            },
            {
              name: 'to',
              type: 'Person'
            },
            {
              name: 'contents',
              type: 'string'
            }
          ],
          Person: [
            {
              name: 'name',
              type: 'string'
            },
            {
              name: 'wallet',
              type: 'address'
            }
          ]
        }
      }

      const safeMessage = generateTypedData({
        safeAddress,
        safeVersion: '1.1.1',
        chainId: 1n,
        data: message
      })

      chai.expect(safeMessage).to.deep.eq({
        types: {
          EIP712Domain: [
            {
              name: 'verifyingContract',
              type: 'address'
            }
          ],
          SafeMessage: [{ name: 'message', type: 'bytes' }]
        },
        domain: {
          verifyingContract: safeAddress
        },
        primaryType: 'SafeMessage',
        message: {
          message: '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2'
        }
      })
    })
  })
})
