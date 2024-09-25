import { Abi } from 'abitype'

import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { SafeVersion } from '@safe-global/types-kit'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendCallOnlyBaseContract extends BaseContract to specifically integrate with the MultiSendCallOnly contract.
 * It is designed to be instantiated for different versions of the MultiSendCallOnly contract.
 *
 * Subclasses of MultiSendCallOnlyBaseContract are expected to represent specific versions of the MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbiType - The ABI type specific to the version of the MultiSendCallOnly contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<MultiSendCallOnlyContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - MultiSendCallOnlyContract_v1_4_1  extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_4_1_Abi>
 * - MultiSendCallOnlyContract_v1_3_0  extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_3_0_Abi>
 */
abstract class MultiSendCallOnlyBaseContract<
  MultiSendCallOnlyContractAbiType extends Abi
> extends BaseContract<MultiSendCallOnlyContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendCallOnlyBaseContract.
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

export default MultiSendCallOnlyBaseContract
