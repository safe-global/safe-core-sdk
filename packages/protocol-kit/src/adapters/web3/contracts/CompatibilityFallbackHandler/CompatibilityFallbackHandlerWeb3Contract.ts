import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types'
import { Compatibility_fallback_handler as CompatibilityFallbackHandler_V1_3_0 } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Compatibility_fallback_handler'

abstract class CompatibilityFallbackHandlerWeb3Contract
  implements CompatibilityFallbackHandlerContract
{
  constructor(public contract: CompatibilityFallbackHandler_V1_3_0) {}

  getAddress(): string {
    return this.contract.options.address
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract as any).methods[methodName](...params).encodeABI()
  }
}

export default CompatibilityFallbackHandlerWeb3Contract
