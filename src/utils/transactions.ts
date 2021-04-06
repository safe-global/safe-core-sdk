import { ZERO_ADDRESS } from './constants'
import { SafeSignature } from './signatures/SafeSignature'

export enum OperationType {
  Call, // 0
  DelegateCall // 1
}

export interface SafeTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation: OperationType
  readonly safeTxGas: number
  readonly baseGas: number
  readonly gasPrice: number
  readonly gasToken: string
  readonly refundReceiver: string
  readonly nonce: number
}

interface SafeTransactionDataPartial {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation?: OperationType
  readonly safeTxGas?: number
  readonly baseGas?: number
  readonly gasPrice?: number
  readonly gasToken?: string
  readonly refundReceiver?: string
  readonly nonce: number
}

export function standardizeSafeTransaction(tx: SafeTransactionDataPartial): SafeTransactionData {
  return {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation || OperationType.Call,
    safeTxGas: tx.safeTxGas || 0,
    baseGas: tx.baseGas || 0,
    gasPrice: tx.gasPrice || 0,
    gasToken: tx.gasToken || ZERO_ADDRESS,
    refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
    nonce: tx.nonce
  }
}

export class SafeTransaction {
  data: SafeTransactionData
  #signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionDataPartial) {
    this.data = standardizeSafeTransaction(data)
  }

  get signatures(): Map<string, SafeSignature> {
    return new Map(this.#signatures)
  }

  addSignature(signature: SafeSignature) {
    this.#signatures.set(signature.signer, signature)
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
