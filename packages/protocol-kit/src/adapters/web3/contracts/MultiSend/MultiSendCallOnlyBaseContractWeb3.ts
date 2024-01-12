import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import MultiSendCallOnlyBaseContract from '@safe-global/protocol-kit/adapters/MultiSendCallOnlyBaseContract'

/**
 * Abstract class SafeBaseContractWeb3 extends MultiSendCallOnlyBaseContract to specifically integrate with the Web3.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Web3 v6 Contract object that interacts with a MultiSendCallOnly contract version.
 *
 * Subclasses of MultiSendCallOnlyBaseContractWeb3 are expected to represent specific versions of the MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbiType - The ABI type specific to the version of the MultiSendCallOnly contract, extending InterfaceAbi from Web3.
 * @extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContractAbiType> - Extends the generic MultiSendCallOnlyBaseContract with Web3-specific implementation.
 *
 * Example subclasses:
 * - MultiSendCallOnlyContract_v1_4_1_Web3 extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_4_1_Abi>
 * - MultiSendCallOnlyContract_v1_3_0_Web3 extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_3_0_Abi>
 */
abstract class MultiSendCallOnlyBaseContractWeb3<
  MultiSendCallOnlyContractAbiType extends AbiItem[]
> extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of SafeBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the MultiSendCallOnly contract. It should be compatible with the specific version of the MultiSendCallOnly contract.
   * @param safeVersion - The version of the MultiSendCallOnly contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSendCallOnly deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: MultiSendCallOnlyContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }
}

export default MultiSendCallOnlyBaseContractWeb3
