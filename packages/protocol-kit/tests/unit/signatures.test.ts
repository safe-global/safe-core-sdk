import chai from 'chai'
import {
  buildSignatureBytes,
  EthSafeSignature,
  extractContractSignatureData
} from '@safe-global/protocol-kit/utils/signatures'

describe('Signature utils', () => {
  describe('extractContractSignatureData', () => {
    it('extracts the dynamic signature data from an exported contract signature', () => {
      const contractSigner = '0x1234567890123456789012345678901234567890'
      const contractSignatureData = '0xdeadbeef'
      const exportedSignature = buildSignatureBytes([
        new EthSafeSignature(contractSigner, contractSignatureData, true)
      ])

      chai.expect(extractContractSignatureData(exportedSignature)).to.be.eq(contractSignatureData)
      chai
        .expect(
          buildSignatureBytes([
            new EthSafeSignature(
              contractSigner,
              extractContractSignatureData(exportedSignature),
              true
            )
          ])
        )
        .to.be.eq(exportedSignature)
    })
  })
})
