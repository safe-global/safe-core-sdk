import CompatibilityFallbackHandlerBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import CompatibilityFallbackHandlerContract_v1_4_1_Contract, {
  CompatibilityFallbackHandlerContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1'
import CompatibilityFallbackHandler_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CompatibilityFallbackHandler/v1.4.1/compatibility_fallback_handler'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * CompatibilityFallbackHandlerContract_v1_4_1_Web3 is the implementation specific to the CompatibilityFallbackHandler contract version 1.4.1.
 *
 * This class specializes in handling interactions with the CompatibilityFallbackHandler contract version 1.4.1 using Web3.js.
 *
 * @extends CompatibilityFallbackHandlerBaseContractWeb3<CompatibilityFallbackHandlerContract_v1_4_1_Abi> - Inherits from CompatibilityFallbackHandlerBaseContractWeb3 with ABI specific to CompatibilityFallbackHandler contract version 1.4.1.
 * @implements CompatibilityFallbackHandlerContract_v1_4_1_Contract - Implements the interface specific to CompatibilityFallbackHandler contract version 1.4.1.
 */
class CompatibilityFallbackHandlerContract_v1_4_1_Web3
  extends CompatibilityFallbackHandlerBaseContractWeb3<
    DeepWriteable<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
  >
  implements CompatibilityFallbackHandlerContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CompatibilityFallbackHandlerContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CompatibilityFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi =
      CompatibilityFallbackHandler_1_4_1_ContractArtifacts.abi as DeepWriteable<CompatibilityFallbackHandlerContract_v1_4_1_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as DeepWriteable<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
    )

    this.safeVersion = safeVersion
  }
}

export default CompatibilityFallbackHandlerContract_v1_4_1_Web3
