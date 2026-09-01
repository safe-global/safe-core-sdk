import { SafeTransactionData, OperationType, EIP712TypedData } from '@safe-global/types-kit'
import chai from 'chai'
import { hashTypedData as viemHashTypedData } from 'viem'
import {
  EIP712_DOMAIN,
  EIP712_DOMAIN_BEFORE_V130,
  generateTypedData,
  getEip712TxTypes,
  hashSafeMessage,
  hashTypedData
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

  describe('hashTypedData / hashSafeMessage with omitted primaryType', () => {
    // Regression test for a hash-collision bug: when `primaryType` is not supplied,
    // `deducePrimaryType` used to take `Object.keys(types)[0]`, which for the
    // conventional `{ EIP712Domain, Mail }` key ordering resolved to `'EIP712Domain'`
    // itself. `encodeTypedData` then skips hashing the message struct entirely
    // (`if (primaryType !== 'EIP712Domain') hashStruct(...)`), so every distinct
    // message under the same domain produced the identical, content-independent hash.
    const domain = {
      chainId: 1,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
    }
    // Matches the raw shape of a real eth_signTypedData_v4 JSON payload (e.g. as
    // produced by MetaMask/wallets and most dapp SDKs), which includes `EIP712Domain`
    // as an explicit key in `types` alongside the message type. With this ordering,
    // `Object.keys(types)[0]` (the old, buggy deduction) resolves to `'EIP712Domain'`
    // itself, which is exactly the failure mode this test guards against — a `types`
    // object that happens to have the message type listed first would not trigger it.
    const types = {
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Mail: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'contents', type: 'string' }
      ]
    }

    const messageA: EIP712TypedData = {
      domain,
      types,
      message: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        contents: '1 ETH'
      }
    }
    const messageB: EIP712TypedData = {
      domain,
      types,
      message: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        contents: '10000 ETH'
      }
    }

    it('should produce distinct hashes for distinct messages when primaryType is omitted', () => {
      // Deep-clone: encodeTypedData mutates typedData.primaryType in place.
      const hashA = hashTypedData(structuredClone(messageA))
      const hashB = hashTypedData(structuredClone(messageB))

      chai.expect(hashA).to.not.eq(hashB)
    })

    it('should match viem hashTypedData with an explicit correct primaryType', () => {
      const deduced = hashTypedData(structuredClone(messageA))
      // `as any`: bypasses viem's stricter generic inference for this ground-truth
      // comparison call only; matches the existing `as any` pattern already used in
      // encode.ts's own encodeTypedData for the same reason.
      const explicit = viemHashTypedData({
        domain,
        types,
        primaryType: 'Mail',
        message: messageA.message
      } as any)

      chai.expect(deduced).to.eq(explicit)
    })

    it('should route hashSafeMessage for typed-data input through the same fixed deduction', () => {
      const hashA = hashSafeMessage(structuredClone(messageA))
      const hashB = hashSafeMessage(structuredClone(messageB))

      chai.expect(hashA).to.not.eq(hashB)
    })

    it('should throw when the types graph has more than one root (genuinely ambiguous)', () => {
      const ambiguous: EIP712TypedData = {
        domain,
        types: {
          Mail: types.Mail,
          Unrelated: [{ name: 'x', type: 'uint256' }]
        },
        message: messageA.message
      }

      chai.expect(() => hashTypedData(ambiguous)).to.throw(/ambiguous|unused/i)
    })

    it('should still respect an explicitly supplied primaryType', () => {
      const explicit: EIP712TypedData = {
        ...structuredClone(messageA),
        primaryType: 'Mail'
      }

      const hash = hashTypedData(explicit)
      const viemHash = viemHashTypedData({
        domain,
        types,
        primaryType: 'Mail',
        message: messageA.message
      } as any)

      chai.expect(hash).to.eq(viemHash)
    })
  })
})
