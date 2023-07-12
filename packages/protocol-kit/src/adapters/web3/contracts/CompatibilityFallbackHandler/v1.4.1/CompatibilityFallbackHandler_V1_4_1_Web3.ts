import { Compatibility_fallback_handler as CompatibilityFallbackHandler } from '@safe-global/protocol-kit/typechain/src/web3-v1/v1.4.1/Compatibility_fallback_handler'
import CompatibilityFallbackHandlerWeb3Contract from '../CompatibilityFallbackHandlerWeb3Contract'

class CompatibilityFallbackHandler_V1_4_1_Web3 extends CompatibilityFallbackHandlerWeb3Contract {
  constructor(public contract: CompatibilityFallbackHandler) {
    super(contract)
  }
}

export default CompatibilityFallbackHandler_V1_4_1_Web3
