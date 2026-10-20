import { SafeOperation } from '@safe-global/types-kit'
import { AddSafeOperationProps } from '../types/safeTransactionServiceTypes'

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

export const isSafeOperation = (
  obj: AddSafeOperationProps | SafeOperation
): obj is SafeOperation => {
  return 'signatures' in obj && 'getUserOperation' in obj && 'getHash' in obj
}
