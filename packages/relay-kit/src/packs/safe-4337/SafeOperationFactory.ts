import {
  UserOperation,
  UserOperationV06,
  UserOperationV07,
  SafeOperationOptions
} from '@safe-global/types-kit'
import SafeOperationV06 from '@safe-global/relay-kit/packs/safe-4337/SafeOperationV06'
import SafeOperationV07 from '@safe-global/relay-kit/packs/safe-4337/SafeOperationV07'
import BaseSafeOperation from '@safe-global/relay-kit/packs/safe-4337/BaseSafeOperation'
import { isEntryPointV6 } from '@safe-global/relay-kit/packs/safe-4337/utils'

class SafeOperationFactory {
  /**
   * Creates a new SafeOperation with proper validation
   * @param userOperation - The base user operation
   * @param options - Configuration options
   * @returns Validated SafeOperation instance
   */
  static createSafeOperation(
    userOperation: UserOperation,
    options: SafeOperationOptions
  ): BaseSafeOperation {
    if (isEntryPointV6(options.entryPoint)) {
      return new SafeOperationV06(userOperation as UserOperationV06, options)
    }

    return new SafeOperationV07(userOperation as UserOperationV07, options)
  }
}

export default SafeOperationFactory
