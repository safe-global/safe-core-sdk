import {
  SafeSignature,
  SafeTransaction,
  SafeTransactionData
} from '@safe-global/safe-core-sdk-types'

class EthSafeTransaction implements SafeTransaction {
  data: SafeTransactionData
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionData) {
    this.data = data
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    const signers = Array.from(this.signatures.keys()).sort()
    const baseOffset = signers.length * 65
    let staticParts = ''
    let dynamicParts = ''
    signers.forEach((signerAddress) => {
      const signature = this.signatures.get(signerAddress)
      staticParts += signature?.staticPart(/*baseOffset + dynamicParts.length / 2*/).slice(2)
      dynamicParts += signature?.dynamicPart()
    })
    return '0x' + staticParts + dynamicParts
  }
}

export default EthSafeTransaction
