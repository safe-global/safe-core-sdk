import { zeroAddress, zeroNumber } from './constants'
import { SafeSignature } from './signatures'

export interface SafeTransactionData {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation: string
  readonly safeTxGas: string
  readonly baseGas: string
  readonly gasPrice: string
  readonly gasToken: string
  readonly refundReceiver: string
  readonly nonce: string
}

interface SafeTransactionDataPartial {
  readonly to: string
  readonly value: string
  readonly data: string
  readonly operation?: string
  readonly safeTxGas?: string
  readonly baseGas?: string
  readonly gasPrice?: string
  readonly gasToken?: string
  readonly refundReceiver?: string
  readonly nonce: string
}

export class SafeTransaction {
  data: SafeTransactionData
  signatures: Map<string, SafeSignature> = new Map()

  constructor(data: SafeTransactionData) {
    this.data = data
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

/**
 * Makes a standardized Safe transaction
 *
 * @param transaction - The Safe transaction object
 * @returns The standardized Safe transaction
 */
export function makeSafeTransaction({
  to,
  value,
  data,
  operation = zeroNumber,
  safeTxGas = zeroNumber,
  baseGas = zeroNumber,
  gasPrice = zeroNumber,
  gasToken = zeroAddress,
  refundReceiver = zeroAddress,
  nonce
}: SafeTransactionDataPartial): SafeTransaction {
  const safeTransactionData: SafeTransactionData = {
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    nonce
  }
  return new SafeTransaction(safeTransactionData)
}
