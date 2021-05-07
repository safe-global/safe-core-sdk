import { SafeSignature } from '../signatures/SafeSignature'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

export interface MetaTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation?: OperationType
}

export interface SafeTransactionData extends MetaTransactionData {
  readonly operation: OperationType
  readonly safeTxGas: number
  readonly baseGas: number
  readonly gasPrice: number
  readonly gasToken: string
  readonly refundReceiver: string
  readonly nonce: number
}

export interface SafeTransactionDataPartial extends MetaTransactionData {
  readonly safeTxGas?: number
  readonly baseGas?: number
  readonly gasPrice?: number
  readonly gasToken?: string
  readonly refundReceiver?: string
  readonly nonce?: number
}

class SafeTransaction {
  data: SafeTransactionData
  #signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionData) {
    this.data = data
  }

  get signatures(): Map<string, SafeSignature> {
    return new Map(this.#signatures)
  }

  addSignature(signature: SafeSignature) {
    this.#signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    const signers = Array.from(this.#signatures.keys()).sort()
    const baseOffset = signers.length * 65
    let staticParts = ''
    let dynamicParts = ''
    signers.forEach((signerAddress) => {
      const signature = this.#signatures.get(signerAddress)
      staticParts += signature?.staticPart(/*baseOffset + dynamicParts.length / 2*/).slice(2)
      dynamicParts += signature?.dynamicPart()
    })
    return '0x' + staticParts + dynamicParts
  }
}

export default SafeTransaction
