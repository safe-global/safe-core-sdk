import { Contract, ContractRunner, InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import CompatibilityFallbackHandlerBaseContract from '@safe-global/protocol-kit/adapters/CompatibilityFallbackHandlerBaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class CompatibilityFallbackHandlerBaseContractEthers extends CompatibilityFallbackHandlerBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a CompatibilityFallbackHandler contract version.
 *
 * Subclasses of CompatibilityFallbackHandlerBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template CompatibilityFallbackHandlerContractAbiType - The ABI type specific to the version of the CompatibilityFallbackHandler contract, extending InterfaceAbi from Ethers.
 * @extends CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContractAbiType> - Extends the generic CompatibilityFallbackHandlerBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - CompatibilityFallbackHandlerContract_v1_4_1_Ethers extends CompatibilityFallbackHandlerBaseContractEthers<CompatibilityFallbackHandlerContract_v1_4_1_Abi>
 * - CompatibilityFallbackHandlerContract_v1_3_0_Ethers extends CompatibilityFallbackHandlerBaseContractEthers<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
 */
abstract class CompatibilityFallbackHandlerBaseContractEthers<
  CompatibilityFallbackHandlerContractAbiType extends InterfaceAbi
> extends CompatibilityFallbackHandlerBaseContract<CompatibilityFallbackHandlerContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of CompatibilityFallbackHandlerBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the CompatibilityFallbackHandler contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: CompatibilityFallbackHandlerContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContractAbiType,
    runner?: ContractRunner | null
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = ethersAdapter
    this.contract = new Contract(
      this.contractAddress,
      this.contractAbi,
      runner || this.adapter.getSigner()
    )
  }
}

export default CompatibilityFallbackHandlerBaseContractEthers
