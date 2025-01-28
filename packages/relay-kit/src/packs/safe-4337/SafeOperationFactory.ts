import Safe from '@safe-global/protocol-kit'
import {
  UserOperation,
  UserOperationV06,
  UserOperationV07,
  SafeOperationOptions
} from '@safe-global/types-kit'
import SafeOperationV06 from '@safe-global/relay-kit/packs/safe-4337/SafeOperationV06'
import SafeOperationV07 from '@safe-global/relay-kit/packs/safe-4337/SafeOperationV07'
import SafeOperationBase from '@safe-global/relay-kit/packs/safe-4337/SafeOperationBase'
import { isEntryPointV7 } from '@safe-global/relay-kit/packs/safe-4337/utils'

class SafeOperationFactory {
  static createSafeOperation(
    userOperation: UserOperation,
    protocolKit: Safe,
    options: SafeOperationOptions
  ): SafeOperationBase {
    if (isEntryPointV7(options.entryPoint)) {
      return new SafeOperationV07(userOperation as UserOperationV07, protocolKit, options)
    } else {
      return new SafeOperationV06(userOperation as UserOperationV06, protocolKit, options)
    }
  }
}

export default SafeOperationFactory
