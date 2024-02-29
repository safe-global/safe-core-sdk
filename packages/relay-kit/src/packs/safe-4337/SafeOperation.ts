import { ethers } from 'ethers'
import { SafeSignature } from '@safe-global/safe-core-sdk-types'
import { buildSignatureBytes } from '@safe-global/protocol-kit'

import { EstimateGasData, SafeUserOperation, UserOperation } from './types'

class SafeOperation {
  data: SafeUserOperation
  signatures: Map<string, SafeSignature> = new Map()

  constructor(userOperation: UserOperation, entryPoint: string) {
    this.data = {
      safe: userOperation.sender,
      nonce: BigInt(userOperation.nonce),
      initCode: userOperation.initCode,
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit,
      verificationGasLimit: userOperation.verificationGasLimit,
      preVerificationGas: userOperation.preVerificationGas,
      maxFeePerGas: userOperation.maxFeePerGas,
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
      paymasterAndData: userOperation.paymasterAndData,
      validAfter: 0n,
      validUntil: 0n,
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
    this.data.maxFeePerGas = BigInt(estimations.maxFeePerGas || this.data.maxFeePerGas)
    this.data.maxPriorityFeePerGas = BigInt(
      estimations.maxPriorityFeePerGas || this.data.maxPriorityFeePerGas
    )
    this.data.verificationGasLimit = BigInt(
      estimations.verificationGasLimit || this.data.verificationGasLimit
    )
    this.data.preVerificationGas = BigInt(
      estimations.preVerificationGas || this.data.preVerificationGas
    )
    this.data.callGasLimit = BigInt(estimations.callGasLimit || this.data.callGasLimit)
  }

  toUserOperation(): UserOperation {
    return {
      sender: this.data.safe,
      nonce: ethers.toBeHex(this.data.nonce),
      initCode: this.data.initCode,
      callData: this.data.callData,
      callGasLimit: this.data.callGasLimit,
      verificationGasLimit: this.data.verificationGasLimit,
      preVerificationGas: this.data.preVerificationGas,
      maxFeePerGas: this.data.maxFeePerGas,
      maxPriorityFeePerGas: this.data.maxPriorityFeePerGas,
      paymasterAndData: this.data.paymasterAndData,
      signature: ethers.solidityPacked(
        ['uint48', 'uint48', 'bytes'],
        [this.data.validAfter, this.data.validUntil, this.encodedSignatures()]
      )
    }
  }
}

export default SafeOperation
