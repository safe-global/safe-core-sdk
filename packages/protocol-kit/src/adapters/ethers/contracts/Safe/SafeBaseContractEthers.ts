import { Abi } from 'abitype'
import { InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import { contractName, safeDeploymentsL1ChainIds } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SafeBaseContractEthers extends BaseContractEthers to specifically integrate with the Safe contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SafeBaseContractEthers are expected to represent specific versions of the Safe contract.
 *
 * @template SafeContractAbiType - The ABI type specific to the version of the Safe contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<SafeContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - SafeContract_v1_4_1_Ethers extends SafeBaseContractEthers<SafeContract_v1_4_1_Abi>
 * - SafeContract_v1_3_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_3_0_Abi>
 * - SafeContract_v1_2_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_2_0_Abi>
 * - SafeContract_v1_1_1_Ethers extends SafeBaseContractEthers<SafeContract_v1_1_1_Abi>
 * - SafeContract_v1_0_0_Ethers extends SafeBaseContractEthers<SafeContract_v1_0_0_Abi>
 */
abstract class SafeBaseContractEthers<
  SafeContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<SafeContractAbiType> {
  contractName: contractName

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
    const isL1Contract = safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeSingleton
    const contractName = isL1Contract ? 'safeSingletonVersion' : 'safeSingletonL2Version'

    super(
      contractName,
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default SafeBaseContractEthers
