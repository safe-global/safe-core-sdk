import CompatibilityFallbackHandlerBaseContract from '@safe-global/protocol-kit/contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  CompatibilityFallbackHandlerContract_v1_3_0_Abi,
  CompatibilityFallbackHandlerContract_v1_3_0_Contract,
  compatibilityFallbackHandler_1_3_0_ContractArtifacts
} from '@safe-global/types-kit'

/**
 * CompatibilityFallbackHandlerContract_v1_3_0  is the implementation specific to the CompatibilityFallbackHandler contract version 1.3.0.
 *
 * This class specializes in handling interactions with the CompatibilityFallbackHandler contract version 1.3.0 using Ethers.js v6.
 *
 * @extends  CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi> - Inherits from  CompatibilityFallbackHandlerBaseContract with ABI specific to CompatibilityFallbackHandler contract version 1.3.0.
 * @implements CompatibilityFallbackHandlerContract_v1_3_0_Contract - Implements the interface specific to CompatibilityFallbackHandler contract version 1.3.0.
 */
class CompatibilityFallbackHandlerContract_v1_3_0
  extends CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
  implements CompatibilityFallbackHandlerContract_v1_3_0_Contract
{
  /**
   * Constructs an instance of CompatibilityFallbackHandlerContract_v1_3_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CompatibilityFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContract_v1_3_0_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = compatibilityFallbackHandler_1_3_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }
}

export default CompatibilityFallbackHandlerContract_v1_3_0
