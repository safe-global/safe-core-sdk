import { Abi } from 'abitype'
import { InterfaceAbi } from 'ethers'

import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContract from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContract'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendCallOnlyBaseContractEthers extends BaseContract to specifically integrate with the MultiSendCallOnly contract.
 * It is designed to be instantiated for different versions of the MultiSendCallOnly contract.
 *
 * Subclasses of MultiSendCallOnlyBaseContractEthers are expected to represent specific versions of the MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbiType - The ABI type specific to the version of the MultiSendCallOnly contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<MultiSendCallOnlyContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - MultiSendCallOnlyContract_v1_4_1_Ethers extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_4_1_Abi>
 * - MultiSendCallOnlyContract_v1_3_0_Ethers extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_3_0_Abi>
 */
abstract class MultiSendCallOnlyBaseContractEthers<
  MultiSendCallOnlyContractAbiType extends InterfaceAbi & Abi
> extends BaseContract<MultiSendCallOnlyContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendCallOnlyBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the MultiSendCallOnly contract. It should be compatible with the specific version of the MultiSendCallOnly contract.
   * @param safeVersion - The version of the MultiSendCallOnly contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSendCallOnly deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: MultiSendCallOnlyContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContractAbiType
  ) {
    const contractName = 'multiSendCallOnlyVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default MultiSendCallOnlyBaseContractEthers
