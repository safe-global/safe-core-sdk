import { Compatibility_fallback_handler as CompatibilityFallbackHandler } from '@safe-global/protocol-kit/typechain/src/ethers-v5/v1.3.0/Compatibility_fallback_handler'
import CompatibilityFallbackHandlerEthersContract from '../CompatibilityFallbackHandlerEthersContract'

class CompatibilityFallbackHandler_V1_3_0_Ethers extends CompatibilityFallbackHandlerEthersContract {
  constructor(public contract: CompatibilityFallbackHandler) {
    super(contract)
  }
}

export default CompatibilityFallbackHandler_V1_3_0_Ethers
