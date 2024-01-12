import { Contract, InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from 'packages/safe-core-sdk-types'
import MultisendBaseContract from '@safe-global/protocol-kit/adapters/MultisendBaseContract'

/**
 * Abstract class SafeBaseContractEthers extends MultisendBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a Multisend contract version.
 *
 * Subclasses of MultiSendBaseContractEthers are expected to represent specific versions of the Multisend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the Multisend contract, extending InterfaceAbi from Ethers.
 * @extends MultisendBaseContract<MultiSendContractAbiType> - Extends the generic MultisendBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContractEthers<
  MultiSendContractAbiType extends InterfaceAbi
> extends MultisendBaseContract<MultiSendContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of SafeBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the Multisend contract. It should be compatible with the specific version of the Multisend contract.
   * @param safeVersion - The version of the Multisend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Multisend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Multisend deployments or the defaultAbi is used.
   * @param onlyCalls - Optional flag to indicate if the contract is only used for calls.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType,
    onlyCalls = false
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi, onlyCalls)

    this.adapter = ethersAdapter
    this.contract = new Contract(this.contractAddress, this.contractAbi, this.adapter.getSigner())
  }
}

export default MultiSendBaseContractEthers
