import { EIP712TypedData, SafeMessage, SafeSignature } from '@safe-global/safe-core-sdk-types'
import { buildSignature } from '../signatures'

class EthSafeMessage implements SafeMessage {
  data: EIP712TypedData | string
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: EIP712TypedData | string) {
    this.data = data
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    return buildSignature(Array.from(this.signatures.values()))
  }
}

export default EthSafeMessage
