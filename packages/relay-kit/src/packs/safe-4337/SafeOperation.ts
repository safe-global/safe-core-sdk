import { ethers } from 'ethers'
import {
  EstimateGasData,
  SafeOperation,
  SafeSignature,
  VersionedSafeUserOperation,
  VersionedUserOperation
} from '@safe-global/safe-core-sdk-types'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { isEntryPointV6 } from './utils/entrypoint'

type SafeOperationOptions = { entryPoint: string; validAfter?: number; validUntil?: number }

class EthSafeOperation implements SafeOperation {
  data: VersionedSafeUserOperation['V6'] | VersionedSafeUserOperation['V7']
  signatures: Map<string, SafeSignature> = new Map()

  constructor(
    userOperation: VersionedUserOperation['V6'] | VersionedUserOperation['V7'],
    { entryPoint, validAfter, validUntil }: SafeOperationOptions
  ) {
    // we assume forward compatibility from 0.7 forward.
    if (isEntryPointV6(entryPoint)) {
      const operation = userOperation as VersionedUserOperation['V6']
      const data: VersionedSafeUserOperation['V6'] = {
        safe: operation.sender,
        nonce: BigInt(operation.nonce),
        initCode: operation.initCode,
        callData: operation.callData,
        callGasLimit: operation.callGasLimit,
        verificationGasLimit: operation.verificationGasLimit,
        preVerificationGas: operation.preVerificationGas,
        maxFeePerGas: operation.maxFeePerGas,
        maxPriorityFeePerGas: operation.maxPriorityFeePerGas,
        paymasterAndData: operation.paymasterAndData,
        validAfter: validAfter || 0,
        validUntil: validUntil || 0,
        entryPoint
      }
      this.data = data
    } else {
      const operation = userOperation as VersionedUserOperation['V7']
      const data: VersionedSafeUserOperation['V7'] = {
        safe: operation.sender,
        nonce: BigInt(operation.nonce),
        factory: operation.factory,
        factoryData: operation.factoryData,
        callData: operation.callData,
        callGasLimit: operation.callGasLimit,
        verificationGasLimit: operation.verificationGasLimit,
        preVerificationGas: operation.preVerificationGas,
        maxFeePerGas: operation.maxFeePerGas,
        maxPriorityFeePerGas: operation.maxPriorityFeePerGas,
        paymaster: operation.paymaster,
        paymasterData: operation.paymasterData,
        validAfter: validAfter || 0,
        validUntil: validUntil || 0,
        entryPoint
      }
      this.data = data
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

  toUserOperation(): VersionedUserOperation['V6'] | VersionedUserOperation['V7'] {
    if (isEntryPointV6(this.data.entryPoint)) {
      const data = this.data as VersionedSafeUserOperation['V6']
      return {
        sender: data.safe,
        nonce: ethers.toBeHex(data.nonce),
        initCode: data.initCode,
        callData: data.callData,
        callGasLimit: data.callGasLimit,
        verificationGasLimit: data.verificationGasLimit,
        preVerificationGas: data.preVerificationGas,
        maxFeePerGas: data.maxFeePerGas,
        maxPriorityFeePerGas: data.maxPriorityFeePerGas,
        paymasterAndData: data.paymasterAndData,
        signature: ethers.solidityPacked(
          ['uint48', 'uint48', 'bytes'],
          [data.validAfter, data.validUntil, this.encodedSignatures()]
        )
      }
    } else {
      const data = this.data as VersionedSafeUserOperation['V7']
      return {
        sender: data.safe,
        nonce: ethers.toBeHex(data.nonce),
        factory: data.factory,
        factoryData: data.factoryData,
        callData: data.callData,
        callGasLimit: data.callGasLimit,
        verificationGasLimit: data.verificationGasLimit,
        preVerificationGas: data.preVerificationGas,
        maxFeePerGas: data.maxFeePerGas,
        maxPriorityFeePerGas: data.maxPriorityFeePerGas,
        paymaster: data.paymaster,
        paymasterData: data.paymasterData,
        signature: ethers.solidityPacked(
          ['uint48', 'uint48', 'bytes'],
          [data.validAfter, data.validUntil, this.encodedSignatures()]
        )
      }
    }
  }
}

export default EthSafeOperation
