import { SafeOperation } from '@safe-global/types-kit'

export const getAddSafeOperationProps = async (safeOperation: SafeOperation) => {
  const userOperation = safeOperation.getUserOperation()
  userOperation.signature = safeOperation.encodedSignatures() // Without validity dates

  return {
    entryPoint: safeOperation.options.entryPoint,
    moduleAddress: safeOperation.options.moduleAddress,
    safeAddress: userOperation.sender,
    userOperation,
    options: {
      validAfter: safeOperation.options.validAfter,
      validUntil: safeOperation.options.validUntil
    }
  }
}
