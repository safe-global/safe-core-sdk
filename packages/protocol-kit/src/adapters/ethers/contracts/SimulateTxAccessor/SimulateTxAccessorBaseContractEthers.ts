import { Abi } from 'abitype'
import { ContractRunner, InterfaceAbi } from 'ethers'

import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SimulateTxAccessorBaseContractEthers extends BaseContractEthers to specifically integrate with the SimulateTxAccessor contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SimulateTxAccessorBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template SimulateTxAccessorContractAbiType - The ABI type specific to the version of the SimulateTxAccessor contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<SimulateTxAccessorContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - SimulateTxAccessorContract_v1_4_1_Ethers extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_4_1_Abi>
 * - SimulateTxAccessorContract_v1_3_0_Ethers extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_3_0_Abi>
 */
abstract class SimulateTxAccessorBaseContractEthers<
  SimulateTxAccessorContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<SimulateTxAccessorContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SimulateTxAccessorBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the SimulateTxAccessor contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: SimulateTxAccessorContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContractAbiType,
    runner?: ContractRunner | null
  ) {
    const contractName = 'simulateTxAccessorVersion'

    super(
      contractName,
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      runner
    )

    this.contractName = contractName
  }
}

export default SimulateTxAccessorBaseContractEthers
