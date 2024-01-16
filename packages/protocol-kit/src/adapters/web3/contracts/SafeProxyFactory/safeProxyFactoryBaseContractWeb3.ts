import Contract from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import SafeProxyFactoryBaseContract from '@safe-global/protocol-kit/adapters/safeProxyFactoryBaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SafeProxyFactoryBaseContractWeb3 extends SafeProxyFactoryBaseContract to specifically integrate with the Web3.js library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Web3.js Contract object that interacts with a Safe Proxy Factory contract version.
 *
 * Subclasses of SafeProxyFactoryBaseContractWeb3 are expected to represent specific versions of the contract.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending AbiItem[].
 * @extends SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> - Extends the generic SafeProxyFactoryBaseContract with Web3.js-specific implementation.
 *
 * Example subclasses:
 * - SafeProxyFactory_v1_4_1_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_4_1_Abi>
 * - SafeProxyFactory_v1_3_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactory_v1_2_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_2_0_Abi>
 * - SafeProxyFactory_v1_1_1_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_1_1_Abi>
 * - SafeProxyFactory_v1_0_0_Web3 extends SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_0_0_Abi>
 */
abstract class SafeProxyFactoryBaseContractWeb3<
  SafeProxyFactoryContractAbiType extends AbiItem[]
> extends SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> {
  contract: Contract
  adapter: Web3Adapter

  /**
   * @constructor
   * Constructs an instance of SafeProxyFactoryBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: SafeProxyFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = web3Adapter
    this.contract = web3Adapter.getContract(this.contractAddress, this.contractAbi)
  }
}

export default SafeProxyFactoryBaseContractWeb3
