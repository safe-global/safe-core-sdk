import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Compatibility_fallback_handler'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_4_1 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Compatibility_fallback_handler'
import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types'

abstract class CompatibilityFallbackHandlerWeb3Contract
  implements CompatibilityFallbackHandlerContract
{
  constructor(
    public contract: CompatibilityFallbackHandler_V1_4_1 | CompatibilityFallbackHandler_V1_3_0
  ) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default CompatibilityFallbackHandlerWeb3Contract
