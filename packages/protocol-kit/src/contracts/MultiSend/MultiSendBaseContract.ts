import { Abi } from 'abitype'

import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { SafeVersion } from '@safe-global/types-kit'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendBaseContract extends BaseContract to specifically integrate with the MultiSend contract.
 * It is designed to be instantiated for different versions of the MultiSend contract.
 *
 * Subclasses of MultiSendBaseContract are expected to represent specific versions of the MultiSend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the MultiSend contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<MultiSendContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1  extends MultiSendBaseContract<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0  extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContract<
  MultiSendContractAbiType extends Abi
> extends BaseContract<MultiSendContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendBaseContract.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the MultiSend contract. It should be compatible with the specific version of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSend deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    const contractName = 'multiSendVersion'

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

export default MultiSendBaseContract
