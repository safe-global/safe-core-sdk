import { Compatibility_fallback_handler as CompatibilityFallbackHandler } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.3.0/Compatibility_fallback_handler'
import CompatibilityFallbackHandlerWeb3Contract from '../CompatibilityFallbackHandlerWeb3Contract'

class CompatibilityFallbackHandler_V1_3_0_Web3 extends CompatibilityFallbackHandlerWeb3Contract {
  constructor(public contract: CompatibilityFallbackHandler) {
    super(contract)
  }
}

export default CompatibilityFallbackHandler_V1_3_0_Web3
