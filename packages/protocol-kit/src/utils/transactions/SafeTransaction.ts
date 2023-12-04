import {
  SafeSignature,
  SafeTransaction,
  SafeTransactionData
} from '@safe-global/safe-core-sdk-types'
import { buildSignature } from '../signatures'

class EthSafeTransaction implements SafeTransaction {
  data: SafeTransactionData
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionData) {
    this.data = data
  }

  getSignature(signer: string): SafeSignature | undefined {
    return this.signatures.get(signer.toLowerCase())
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    return buildSignature(Array.from(this.signatures.values()))
  }
}

export default EthSafeTransaction
