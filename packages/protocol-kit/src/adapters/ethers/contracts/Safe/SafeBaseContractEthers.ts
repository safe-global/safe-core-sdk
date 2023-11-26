import { Contract, InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from 'packages/safe-core-sdk-types'
import SafeBaseContract from '@safe-global/protocol-kit/adapters/SafeBaseContract'

/**
 * Abstract class SafeBaseContractEthers extends SafeBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a Safe contract version.
 *
 * Subclasses of SafeBaseContractEthers are expected to represent specific versions of the Safe contract.
 *
 * @template SafeContractAbiType - The ABI type specific to the version of the Safe contract, extending InterfaceAbi from Ethers.
 * @extends SafeBaseContract<SafeContractAbiType> - Extends the generic SafeBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - SafeContract_v1_4_1_Ethers extends SafeBaseContractEthers<SafeContract_v1_4_1_Abi>
 * - SafeContract_v1_3_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_3_0_Abi>
 * - SafeContract_v1_2_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_2_0_Abi>
 * - SafeContract_v1_1_1_Ethers extends SafeBaseContractEthers<SafeContract_v1_1_1_Abi>
 * - SafeContract_v1_0_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_0_0_Abi>
 */
abstract class SafeBaseContractEthers<
  SafeContractAbiType extends InterfaceAbi
> extends SafeBaseContract<SafeContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of SafeBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the Safe contract.
   * @param safeVersion - The version of the Safe contract.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: SafeContractAbiType,
    safeVersion: SafeVersion,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContractAbiType
  ) {
    super(
      chainId,
      defaultAbi,
      safeVersion,
      isL1SafeSingleton,
      customContractAddress,
      customContractAbi
    )

    this.adapter = ethersAdapter
    this.contract = new Contract(this.contractAddress, this.contractAbi, this.adapter.getSigner())
  }
}

export default SafeBaseContractEthers
