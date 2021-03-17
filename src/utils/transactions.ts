import { zeroAddress } from './constants'
import { SafeSignature } from './signatures'

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
    gasToken: tx.gasToken || zeroAddress,
    refundReceiver: tx.refundReceiver || zeroAddress,
    nonce: tx.nonce
  }
}

export class SafeTransaction {
  data: SafeTransactionData
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionDataPartial) {
    this.data = standardizeSafeTransaction(data)
  }

  encodedSignatures(): string {
    const signers = Array.from(this.signatures.keys()).sort()
    const baseOffset = signers.length * 130
    let staticParts = ''
    let dynamicParts = ''
    signers.forEach((signerAddress) => {
      const signer = this.signatures.get(signerAddress)!!
      staticParts += signer.staticPart(/*baseOffset + dynamicParts.length / 2*/)
      dynamicParts += signer.dynamicPart()
    })
    return '0x' + staticParts + dynamicParts
  }
}
