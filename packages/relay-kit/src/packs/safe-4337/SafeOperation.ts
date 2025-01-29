import { Hex, encodePacked } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeSignature,
  SafeUserOperation,
  UserOperation
} from '@safe-global/types-kit'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { calculateSafeUserOperationHash } from './utils'

type SafeOperationOptions = {
  moduleAddress: string
  entryPoint: string
  chainId: bigint
  validAfter?: number
  validUntil?: number
}

class EthSafeOperation implements SafeOperation {
  data: SafeUserOperation
  signatures: Map<string, SafeSignature> = new Map()
  moduleAddress: string
  chainId: bigint

  constructor(
    userOperation: UserOperation,
    { chainId, entryPoint, validAfter, validUntil, moduleAddress }: SafeOperationOptions
  ) {
    this.chainId = chainId
    this.moduleAddress = moduleAddress
    this.data = {
      safe: userOperation.sender,
      nonce: userOperation.nonce,
      initCode: userOperation.initCode,
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit,
      verificationGasLimit: userOperation.verificationGasLimit,
      preVerificationGas: userOperation.preVerificationGas,
      maxFeePerGas: userOperation.maxFeePerGas,
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
      paymasterAndData: userOperation.paymasterAndData,
      validAfter: validAfter || 0,
      validUntil: validUntil || 0,
      entryPoint
    }
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

  addEstimations(estimations: EstimateGasData): void {
    const keys: (keyof EstimateGasData)[] = [
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'verificationGasLimit',
      'preVerificationGas',
      'callGasLimit'
    ]

    for (const key of keys) {
      this.data[key] = BigInt(estimations[key] || this.data[key])
    }
  }

  toUserOperation(): UserOperation {
    return {
      sender: this.data.safe,
      nonce: this.data.nonce,
      initCode: this.data.initCode,
      callData: this.data.callData,
      callGasLimit: this.data.callGasLimit,
      verificationGasLimit: this.data.verificationGasLimit,
      preVerificationGas: this.data.preVerificationGas,
      maxFeePerGas: this.data.maxFeePerGas,
      maxPriorityFeePerGas: this.data.maxPriorityFeePerGas,
      paymasterAndData: this.data.paymasterAndData,
      signature: encodePacked(
        ['uint48', 'uint48', 'bytes'],
        [this.data.validAfter, this.data.validUntil, this.encodedSignatures() as Hex]
      )
    }
  }

  getHash(): string {
    return calculateSafeUserOperationHash(this.data, this.chainId, this.moduleAddress)
  }
}

export default EthSafeOperation
