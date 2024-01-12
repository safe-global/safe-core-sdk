import { Contract, InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import SafeProxyFactoryBaseContract from '@safe-global/protocol-kit/adapters/safeProxyFactoryBaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SafeProxyFactoryBaseContractEthers extends SafeProxyFactoryBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a Safe Proxy Factory contract version.
 *
 * Subclasses of SafeProxyFactoryBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI type specific to the version of the Safe Proxy Factory contract, extending InterfaceAbi from Ethers.
 * @extends SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> - Extends the generic SafeProxyFactoryBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - SafeProxyFactory_v1_4_1_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_4_1_Abi>
 * - SafeProxyFactory_v1_3_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactory_v1_2_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_2_0_Abi>
 * - SafeProxyFactory_v1_1_1_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_1_1_Abi>
 * - SafeProxyFactory_v1_0_0_Ethers extends SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_0_0_Abi>
 */
abstract class SafeProxyFactoryBaseContractEthers<
  SafeProxyFactoryContractAbiType extends InterfaceAbi
> extends SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> {
  contract: Contract
  adapter: EthersAdapter

  /**
   * @constructor
   * Constructs an instance of SafeProxyFactoryBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the Safe contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: SafeProxyFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContractAbiType
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.adapter = ethersAdapter
    this.contract = new Contract(this.contractAddress, this.contractAbi, this.adapter.getSigner())
  }
}

export default SafeProxyFactoryBaseContractEthers
