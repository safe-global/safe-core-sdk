import Safe from '@safe-global/protocol-kit'
import {
  UserOperation,
  UserOperationV06,
  UserOperationV07,
  SafeOperationOptions
} from '@safe-global/types-kit'
import SafeOperationV06 from './SafeOperationV06'
import SafeOperationV07 from './SafeOperationV07'
import SafeOperationBase from './SafeOperationBase'
import { isEntryPointV7 } from './utils/entrypoint'

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
