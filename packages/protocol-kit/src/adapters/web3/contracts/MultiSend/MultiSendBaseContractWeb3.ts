import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import MultiSendBaseContract from '@safe-global/protocol-kit/adapters/MultiSendBaseContract'

/**
 * Abstract class SafeBaseContractWeb3 extends MultiSendBaseContract to specifically integrate with the Web3.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Web3 v6 Contract object that interacts with a MultiSend contract version.
 *
 * Subclasses of MultiSendBaseContractWeb3 are expected to represent specific versions of the MultiSend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the MultiSend contract, extending InterfaceAbi from Web3.
 * @extends MultiSendBaseContract<MultiSendContractAbiType> - Extends the generic MultiSendBaseContract with Web3-specific implementation.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1_Web3 extends MultiSendBaseContractWeb3<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0_Web3 extends MultiSendBaseContractWeb3<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContractWeb3<
  MultiSendContractAbiType extends AbiItem[]
> extends MultiSendBaseContract<MultiSendContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of SafeBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the MultiSend contract. It should be compatible with the specific version of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSend deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }
}

export default MultiSendBaseContractWeb3
