import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from 'packages/safe-core-sdk-types'
import SafeBaseContract from '@safe-global/protocol-kit/adapters/SafeBaseContract'

/**
 * Abstract class SafeBaseContractWeb3 extends SafeBaseContract to specifically integrate with the Web3.js library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Web3.js Contract object that interacts with a Safe contract version.
 *
 * Subclasses of SafeBaseContractWeb3 are expected to represent specific versions of the Safe contract.
 *
 * @template SafeContractAbiType - The ABI type specific to the version of the Safe contract, extending AbiItem.
 * @extends SafeBaseContract<SafeContractAbiType> - Extends the generic SafeBaseContract with Web3-specific implementation.
 *
 * Example subclasses:
 * - SafeContract_v1_4_1_Web3 extends SafeBaseContractWeb3<SafeContract_v1_4_1_Abi>
 * - SafeContract_v1_3_0_Web3 extends SafeBaseContractWeb3<SafeContract_v1_3_0_Abi>
 * - SafeContract_v1_2_0_Web3 extends SafeBaseContractWeb3<SafeContract_v1_2_0_Abi>
 * - SafeContract_v1_1_1_Web3 extends SafeBaseContractWeb3<SafeContract_v1_1_1_Abi>
 * - SafeContract_v1_0_0_Web3 extends SafeBaseContractWeb3<SafeContract_v1_0_0_Abi>
 */
abstract class SafeBaseContractWeb3<
  SafeContractAbiType extends AbiItem[]
> extends SafeBaseContract<SafeContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of SafeBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter  - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the Safe contract.
   * @param safeVersion - The version of the Safe contract.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
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

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }
}

export default SafeBaseContractWeb3
