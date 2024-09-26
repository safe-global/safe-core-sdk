import CompatibilityFallbackHandlerBaseContract from '@safe-global/protocol-kit/contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  compatibilityFallbackHandler_1_4_1_ContractArtifacts,
  CompatibilityFallbackHandlerContract_v1_4_1_Abi,
  CompatibilityFallbackHandlerContract_v1_4_1_Contract
} from '@safe-global/types-kit'

/**
 * CompatibilityFallbackHandlerContract_v1_4_1  is the implementation specific to the CompatibilityFallbackHandler contract version 1.4.1.
 *
 * This class specializes in handling interactions with the CompatibilityFallbackHandler contract version 1.4.1 using Ethers.js v6.
 *
 * @extends  CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_4_1_Abi> - Inherits from  CompatibilityFallbackHandlerBaseContract with ABI specific to CompatibilityFallbackHandler contract version 1.4.1.
 * @implements CompatibilityFallbackHandlerContract_v1_4_1_Contract - Implements the interface specific to CompatibilityFallbackHandler contract version 1.4.1.
 */
class CompatibilityFallbackHandlerContract_v1_4_1
  extends CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
  implements CompatibilityFallbackHandlerContract_v1_4_1_Contract
{
  /**
   * Constructs an instance of CompatibilityFallbackHandlerContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CompatibilityFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContract_v1_4_1_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = compatibilityFallbackHandler_1_4_1_ContractArtifacts.abi

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

export default CompatibilityFallbackHandlerContract_v1_4_1
