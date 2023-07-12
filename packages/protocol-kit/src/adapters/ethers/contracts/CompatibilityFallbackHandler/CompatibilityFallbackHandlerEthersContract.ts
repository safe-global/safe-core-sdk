import {
  Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0,
  Compatibility_fallback_handlerInterface as CompatibilityFallbackHandlerInterface
} from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Compatibility_fallback_handler'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.4.1/Compatibility_fallback_handler'
import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types'

abstract class CompatibilityFallbackHandlerEthersContract
  implements CompatibilityFallbackHandlerContract
{
  constructor(
    public contract: CompatibilityFallbackHandler_V1_4_1 | CompatibilityFallbackHandler_V1_3_0
  ) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: CompatibilityFallbackHandlerInterface['encodeFunctionData'] = (
    methodName: any,
    params: any
  ): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default CompatibilityFallbackHandlerEthersContract
