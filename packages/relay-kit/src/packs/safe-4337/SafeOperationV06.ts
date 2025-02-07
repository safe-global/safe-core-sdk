import {
  UserOperationV06,
  EstimateGasData,
  SafeUserOperation,
  SafeOperationOptions
} from '@safe-global/types-kit'
import BaseSafeOperation from '@safe-global/relay-kit/packs/safe-4337/BaseSafeOperation'
import { EIP712_SAFE_OPERATION_TYPE_V06 } from '@safe-global/relay-kit/packs/safe-4337/constants'

class SafeOperationV06 extends BaseSafeOperation {
  userOperation!: UserOperationV06

  constructor(userOperation: UserOperationV06, options: SafeOperationOptions) {
    super(userOperation, options)
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
    this.userOperation.paymasterAndData =
      estimations.paymasterAndData || this.userOperation.paymasterAndData
  }

  getSafeOperation(): SafeUserOperation {
    return {
      safe: this.userOperation.sender,
      nonce: this.userOperation.nonce,
      initCode: this.userOperation.initCode,
      callData: this.userOperation.callData,
      callGasLimit: this.userOperation.callGasLimit,
      verificationGasLimit: this.userOperation.verificationGasLimit,
      preVerificationGas: this.userOperation.preVerificationGas,
      maxFeePerGas: this.userOperation.maxFeePerGas,
      maxPriorityFeePerGas: this.userOperation.maxPriorityFeePerGas,
      paymasterAndData: this.userOperation.paymasterAndData,
      validAfter: this.options.validAfter || 0,
      validUntil: this.options.validUntil || 0,
      entryPoint: this.options.entryPoint
    }
  }

  getEIP712Type() {
    return EIP712_SAFE_OPERATION_TYPE_V06
  }
}

export default SafeOperationV06
