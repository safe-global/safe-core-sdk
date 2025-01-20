import { Hex, concat, encodePacked, isAddress, pad, toHex } from 'viem'
import {
  EstimateGasData,
  SafeOperation,
  SafeOperationOptions,
  SafeSignature,
  SafeUserOperation,
  UserOperation,
  UserOperationV06,
  UserOperationV07
} from '@safe-global/types-kit'
import { buildSignatureBytes } from '@safe-global/protocol-kit'
import { calculateSafeUserOperationHash } from './utils'
import { isEntryPointV7 } from './utils/entrypoint'

class EthSafeOperation implements SafeOperation {
  options: SafeOperationOptions
  userOperation: UserOperation
  signatures: Map<string, SafeSignature> = new Map()

  constructor(userOperation: UserOperation, options: SafeOperationOptions) {
    this.userOperation = userOperation
    this.options = options
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
    const userOpV06 = this.userOperation as UserOperationV06
    userOpV06.maxFeePerGas = BigInt(estimations.maxFeePerGas || userOpV06.maxFeePerGas)
    userOpV06.maxPriorityFeePerGas = BigInt(
      estimations.maxPriorityFeePerGas || userOpV06.maxPriorityFeePerGas
    )
    userOpV06.verificationGasLimit = BigInt(
      estimations.verificationGasLimit || userOpV06.verificationGasLimit
    )
    userOpV06.preVerificationGas = BigInt(
      estimations.preVerificationGas || userOpV06.preVerificationGas
    )
    userOpV06.callGasLimit = BigInt(estimations.callGasLimit || userOpV06.callGasLimit)

    userOpV06.paymasterAndData = estimations.paymasterAndData || userOpV06.paymasterAndData

    if (isEntryPointV7(this.options.entryPoint)) {
      const userOp = this.userOperation as UserOperationV07
      userOp.paymasterPostOpGasLimit = estimations.paymasterPostOpGasLimit
        ? BigInt(estimations.paymasterPostOpGasLimit) || userOp.paymasterPostOpGasLimit
        : undefined
      userOp.paymasterVerificationGasLimit = estimations.paymasterVerificationGasLimit
        ? BigInt(estimations.paymasterVerificationGasLimit) || userOp.paymasterVerificationGasLimit
        : undefined
      userOp.paymaster = estimations.paymaster || userOp.paymaster
      userOp.paymasterData = estimations.paymasterData || userOp.paymasterData
    }
  }

  getSafeOperation(): SafeUserOperation {
    let initCode
    let paymasterAndData

    if (isEntryPointV7(this.options.entryPoint)) {
      const userOpV07 = this.userOperation as UserOperationV07

      initCode = userOpV07.factory
        ? concat([userOpV07.factory as Hex, (userOpV07.factoryData as Hex) || ('0x' as Hex)])
        : '0x'

      paymasterAndData = isAddress(userOpV07.paymaster || '')
        ? concat([
            userOpV07.paymaster as Hex,
            pad(toHex(userOpV07.paymasterVerificationGasLimit || 0n), {
              size: 16
            }),
            pad(toHex(userOpV07.paymasterPostOpGasLimit || 0n), {
              size: 16
            }),
            (userOpV07.paymasterData as Hex) || ('0x' as Hex)
          ])
        : '0x'
    } else {
      const userOpV06 = this.userOperation as UserOperationV06

      initCode = userOpV06.initCode
      paymasterAndData = userOpV06.paymasterAndData
    }

    return {
      safe: this.userOperation.sender,
      nonce: BigInt(this.userOperation.nonce),
      initCode,
      callData: this.userOperation.callData,
      callGasLimit: this.userOperation.callGasLimit,
      verificationGasLimit: this.userOperation.verificationGasLimit,
      preVerificationGas: this.userOperation.preVerificationGas,
      maxFeePerGas: this.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: this.userOperation.maxPriorityFeePerGas,
      paymasterAndData,
      validAfter: this.options.validAfter || 0,
      validUntil: this.options.validUntil || 0,
      entryPoint: this.options.entryPoint
    }
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
    return calculateSafeUserOperationHash(
      this.getSafeOperation(),
      this.options.chainId,
      this.options.moduleAddress,
      this.options.entryPoint
    )
  }
}

export default EthSafeOperation
