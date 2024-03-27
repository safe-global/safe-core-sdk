import CompatibilityFallbackHandlerBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/CompatibilityFallbackHandler/CompatibilityFallbackHandlerBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import CompatibilityFallbackHandlerContract_v1_3_0_Contract, {
  CompatibilityFallbackHandlerContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0'
import CompatibilityFallbackHandler_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/CompatibilityFallbackHandler/v1.3.0/compatibility_fallback_handler'
import {
  EncodeFunction,
  GetAddressFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * CompatibilityFallbackHandlerContract_v1_3_0_Ethers is the implementation specific to the CompatibilityFallbackHandler contract version 1.3.0.
 *
 * This class specializes in handling interactions with the CompatibilityFallbackHandler contract version 1.3.0 using Ethers.js v6.
 *
 * @extends CompatibilityFallbackHandlerBaseContractEthers<CompatibilityFallbackHandlerContract_v1_3_0_Abi> - Inherits from CompatibilityFallbackHandlerBaseContractEthers with ABI specific to CompatibilityFallbackHandler contract version 1.3.0.
 * @implements CompatibilityFallbackHandlerContract_v1_3_0_Contract - Implements the interface specific to CompatibilityFallbackHandler contract version 1.3.0.
 */
class CompatibilityFallbackHandlerContract_v1_3_0_Ethers
  extends CompatibilityFallbackHandlerBaseContractEthers<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
  implements CompatibilityFallbackHandlerContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of CompatibilityFallbackHandlerContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the CompatibilityFallbackHandler deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = CompatibilityFallbackHandler_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<CompatibilityFallbackHandlerContract_v1_3_0_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default CompatibilityFallbackHandlerContract_v1_3_0_Ethers
