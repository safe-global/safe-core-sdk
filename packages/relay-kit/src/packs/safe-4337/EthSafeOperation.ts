import { SafeSignature } from '@safe-global/safe-core-sdk-types'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { SafeUserOperation, SafeOperation } from './types'

class EthSafeOperation implements SafeOperation {
  data: SafeUserOperation
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeUserOperation) {
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

export default EthSafeOperation
