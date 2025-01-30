import {
  UserOperationV07,
  EstimateGasData,
  SafeUserOperation,
  SafeOperationOptions
} from '@safe-global/types-kit'
import { concat, Hex, isAddress, pad, toHex } from 'viem'
import SafeOperationBase from '@safe-global/relay-kit/packs/safe-4337/SafeOperationBase'
import { EIP712_SAFE_OPERATION_TYPE_V07 } from '@safe-global/relay-kit/packs/safe-4337/constants'
import Safe from '@safe-global/protocol-kit'

class SafeOperationV07 extends SafeOperationBase {
  userOperation!: UserOperationV07

  constructor(userOperation: UserOperationV07, protocolKit: Safe, options: SafeOperationOptions) {
    super(userOperation, protocolKit, options)
  }

  addEstimations(estimations: EstimateGasData): void {
    this.userOperation.maxFeePerGas = BigInt(
      estimations.maxFeePerGas || this.userOperation.maxFeePerGas
    )
    this.userOperation.maxPriorityFeePerGas = BigInt(
      estimations.maxPriorityFeePerGas || this.userOperation.maxPriorityFeePerGas
    )
    this.userOperation.verificationGasLimit = BigInt(
      estimations.verificationGasLimit || this.userOperation.verificationGasLimit
    )
    this.userOperation.preVerificationGas = BigInt(
      estimations.preVerificationGas || this.userOperation.preVerificationGas
    )
    this.userOperation.callGasLimit = BigInt(
      estimations.callGasLimit || this.userOperation.callGasLimit
    )

    this.userOperation.paymasterPostOpGasLimit = estimations.paymasterPostOpGasLimit
      ? BigInt(estimations.paymasterPostOpGasLimit)
      : this.userOperation.paymasterPostOpGasLimit
    this.userOperation.paymasterVerificationGasLimit = estimations.paymasterVerificationGasLimit
      ? BigInt(estimations.paymasterVerificationGasLimit)
      : this.userOperation.paymasterVerificationGasLimit
    this.userOperation.paymaster = estimations.paymaster || this.userOperation.paymaster
    this.userOperation.paymasterData = estimations.paymasterData || this.userOperation.paymasterData
  }

  getSafeOperation(): SafeUserOperation {
    const initCode = this.userOperation.factory
      ? concat([
          this.userOperation.factory as Hex,
          (this.userOperation.factoryData as Hex) || ('0x' as Hex)
        ])
      : '0x'

    const paymasterAndData = isAddress(this.userOperation.paymaster || '')
      ? concat([
          this.userOperation.paymaster as Hex,
          pad(toHex(this.userOperation.paymasterVerificationGasLimit || 0n), {
            size: 16
          }),
          pad(toHex(this.userOperation.paymasterPostOpGasLimit || 0n), {
            size: 16
          }),
          (this.userOperation.paymasterData as Hex) || ('0x' as Hex)
        ])
      : '0x'

    return {
      safe: this.userOperation.sender,
      nonce: this.userOperation.nonce,
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

  getEIP712Type() {
    return EIP712_SAFE_OPERATION_TYPE_V07
  }
}

export default SafeOperationV07
