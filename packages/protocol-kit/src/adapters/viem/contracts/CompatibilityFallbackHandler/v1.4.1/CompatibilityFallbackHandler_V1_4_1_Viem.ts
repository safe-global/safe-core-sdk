import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import CompatibilityFallbackHandlerContractViem from '../CompatibilityFallbackHandlerContractViem'
import { ViemContractBaseArgs } from '../../../ViemContract'

class CompatibilityFallbackHandler_V1_4_1_Viem extends CompatibilityFallbackHandlerContractViem {
  constructor(args: ViemContractBaseArgs) {
    super({ ...args, abi: CompatibilityFallbackHandler__factory.abi })
  }
}

export default CompatibilityFallbackHandler_V1_4_1_Viem
