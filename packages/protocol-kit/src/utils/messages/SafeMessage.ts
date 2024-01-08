import { EIP712TypedData, SafeMessage, SafeSignature } from '@safe-global/safe-core-sdk-types'
import { buildSignatureBytes } from '../signatures'

class EthSafeMessage implements SafeMessage {
  data: EIP712TypedData | string
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: EIP712TypedData | string) {
    this.data = data
  }

  getSignature(signer: string): SafeSignature | undefined {
    return this.signatures.get(signer.toLowerCase())
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    return buildSignatureBytes(Array.from(this.signatures.values()))
  }
}

export default EthSafeMessage
