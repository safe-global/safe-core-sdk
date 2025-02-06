import { SafeOperationBase } from '@safe-global/relay-kit'

export const getAddSafeOperationProps = async (safeOperation: SafeOperationBase) => {
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
