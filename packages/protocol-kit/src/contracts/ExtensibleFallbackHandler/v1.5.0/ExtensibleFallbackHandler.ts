import ExtensibleFallbackHandlerBaseContract from '@safe-global/protocol-kit/contracts/ExtensibleFallbackHandler/ExtensibleFallbackHandlerBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  extensibleFallbackHandler_1_5_0_ContractArtifacts,
  ExtensibleFallbackHandlerContract_v1_5_0_Abi,
  ExtensibleFallbackHandlerContract_v1_5_0_Contract
} from '@safe-global/types-kit'

/**
 * ExtensibleFallbackHandlerContract_v1_5_0 is the implementation specific to the ExtensibleFallbackHandler contract version 1.5.0.
 *
 * This class specializes in handling interactions with the ExtensibleFallbackHandler contract version 1.5.0 using Ethers.js v6.
 *
 * @extends ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi> - Inherits from ExtensibleFallbackHandlerBaseContract with ABI specific to ExtensibleFallbackHandler contract version 1.5.0.
 * @implements ExtensibleFallbackHandlerContract_v1_5_0_Contract - Implements the interface specific to ExtensibleFallbackHandler contract version 1.5.0.
 */
class ExtensibleFallbackHandlerContract_v1_5_0
  extends ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
  implements ExtensibleFallbackHandlerContract_v1_5_0_Contract
{
  /**
   * Constructs an instance of ExtensibleFallbackHandlerContract_v1_5_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the ExtensibleFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.5.0 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: ExtensibleFallbackHandlerContract_v1_5_0_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.5.0'
    const defaultAbi = extensibleFallbackHandler_1_5_0_ContractArtifacts.abi

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

export default ExtensibleFallbackHandlerContract_v1_5_0
