import { Hex, encodePacked, hashTypedData } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeOperationOptions,
  SafeSignature,
  SafeUserOperation,
  UserOperation
} from '@safe-global/types-kit'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import {
  EIP712_SAFE_OPERATION_TYPE_V06,
  EIP712_SAFE_OPERATION_TYPE_V07
} from '@safe-global/relay-kit/packs/safe-4337/constants'

abstract class BaseSafeOperation implements SafeOperation {
  userOperation: UserOperation
  options: SafeOperationOptions
  signatures: Map<string, SafeSignature> = new Map()

  constructor(userOperation: UserOperation, options: SafeOperationOptions) {
    this.userOperation = userOperation
    this.options = options
  }

  abstract addEstimations(estimations: EstimateGasData): void

  abstract getSafeOperation(): SafeUserOperation

  getSignature(signer: string): SafeSignature | undefined {
    return this.signatures.get(signer.toLowerCase())
  }

  addSignature(signature: SafeSignature): void {
    this.signatures.set(signature.signer.toLowerCase(), signature)
  }

  encodedSignatures(): string {
    return buildSignatureBytes(Array.from(this.signatures.values()))
  }

  getUserOperation(): UserOperation {
    return {
      ...this.userOperation,
      signature: encodePacked(
        ['uint48', 'uint48', 'bytes'],
        [
          this.options.validAfter || 0,
          this.options.validUntil || 0,
          this.encodedSignatures() as Hex
        ]
      )
    }
  }

  getHash(): string {
    return hashTypedData({
      domain: {
        chainId: Number(this.options.chainId),
        verifyingContract: this.options.moduleAddress
      },
      types: this.getEIP712Type(),
      primaryType: 'SafeOp',
      message: this.getSafeOperation()
    })
  }

  abstract getEIP712Type():
    | typeof EIP712_SAFE_OPERATION_TYPE_V06
    | typeof EIP712_SAFE_OPERATION_TYPE_V07
}

export default BaseSafeOperation
