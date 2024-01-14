import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_3_0__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.3.0'
import { Compatibility_fallback_handler__factory as CompatibilityFallbackHandler_V1_4_1__factory } from '@safe-global/protocol-kit/typechain/src/ethers-v6/v1.4.1'
import { CompatibilityFallbackHandlerContract } from '@safe-global/safe-core-sdk-types'
import { ViemContract, ViemContractBaseArgs } from '../../ViemContract'

type CompatibilityFallbackHandlerAbi =
  | typeof CompatibilityFallbackHandler_V1_3_0__factory.abi
  | typeof CompatibilityFallbackHandler_V1_4_1__factory.abi

abstract class CompatibilityFallbackHandlerContractViem
  extends ViemContract<CompatibilityFallbackHandlerAbi>
  implements CompatibilityFallbackHandlerContract
{
  constructor(args: ViemContractBaseArgs & { abi: CompatibilityFallbackHandlerAbi }) {
    super(args)
  }
}

export default CompatibilityFallbackHandlerContractViem
