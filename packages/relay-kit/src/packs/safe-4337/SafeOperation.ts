import { ethers } from 'ethers'
import { SafeSignature } from '@safe-global/safe-core-sdk-types'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { SafeUserOperation, UserOperation } from './types'
import { SAFE_ADDRESSES_MAP } from './constants'

class SafeOperation {
  data: SafeUserOperation
  signatures: Map<string, SafeSignature> = new Map()

  constructor(userOperation: UserOperation) {
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
      entryPoint: SAFE_ADDRESSES_MAP.ENTRY_POINT_ADDRESS
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
