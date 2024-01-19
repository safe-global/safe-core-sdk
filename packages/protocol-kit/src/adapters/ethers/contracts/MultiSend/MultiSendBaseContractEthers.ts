import { Contract, InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import MultiSendBaseContract from '@safe-global/protocol-kit/adapters/MultiSendBaseContract'

/**
 * Abstract class MultiSendBaseContractEthers extends MultiSendBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the MultiSend contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a MultiSend contract version.
 *
 * Subclasses of MultiSendBaseContractEthers are expected to represent specific versions of the MultiSend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the MultiSend contract, extending InterfaceAbi from Ethers.
 * @extends MultiSendBaseContract<MultiSendContractAbiType> - Extends the generic MultiSendBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContractEthers<
  MultiSendContractAbiType extends InterfaceAbi
> extends MultiSendBaseContract<MultiSendContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of MultiSendBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the MultiSend contract. It should be compatible with the specific version of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSend deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = ethersAdapter
    this.contract = new Contract(this.contractAddress, this.contractAbi, this.adapter.getSigner())
  }
}

export default MultiSendBaseContractEthers
