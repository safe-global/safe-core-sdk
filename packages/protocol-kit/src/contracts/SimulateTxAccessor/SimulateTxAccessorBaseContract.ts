import { Abi } from 'abitype'

import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/types-kit'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class SimulateTxAccessorBaseContract extends BaseContract to specifically integrate with the SimulateTxAccessor contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SimulateTxAccessorBaseContract are expected to represent specific versions of the contract.
 *
 * @template SimulateTxAccessorContractAbiType - The ABI type specific to the version of the SimulateTxAccessor contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<SimulateTxAccessorContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - SimulateTxAccessorContract_v1_4_1  extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_4_1_Abi>
 * - SimulateTxAccessorContract_v1_3_0  extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
 */
abstract class SimulateTxAccessorBaseContract<
  SimulateTxAccessorContractAbiType extends Abi
> extends BaseContract<SimulateTxAccessorContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SimulateTxAccessorBaseContract.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the SimulateTxAccessor contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: SimulateTxAccessorContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContractAbiType,
    deploymentType?: DeploymentType
  ) {
    const contractName = 'simulateTxAccessorVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )

    this.contractName = contractName
  }
}

export default SimulateTxAccessorBaseContract
