import { SafeOperation } from '@safe-global/safe-core-sdk-types'

export const getAddSafeOperationProps = async (safeOperation: SafeOperation) => {
  const userOperation = safeOperation.toUserOperation()
  userOperation.signature = safeOperation.encodedSignatures()
  return {
    entryPoint: safeOperation.data.entryPoint,
    moduleAddress: safeOperation.moduleAddress,
    safeAddress: safeOperation.data.safe,
    userOperation,
    options: {
      validAfter: safeOperation.data.validAfter,
      validUntil: safeOperation.data.validUntil
    }
  }
}
