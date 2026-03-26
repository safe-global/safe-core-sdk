import { Abi } from 'abitype'

import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import { SafeVersion } from '@safe-global/types-kit'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class ExtensibleFallbackHandlerBaseContract extends BaseContract to specifically integrate with the ExtensibleFallbackHandler contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of ExtensibleFallbackHandlerBaseContract are expected to represent specific versions of the contract.
 *
 * @template ExtensibleFallbackHandlerContractAbiType - The ABI type specific to the version of the ExtensibleFallbackHandler contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<ExtensibleFallbackHandlerContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - ExtensibleFallbackHandlerContract_v1_5_0  extends  ExtensibleFallbackHandlerBaseContract<ExtensibleFallbackHandlerContract_v1_5_0_Abi>
 */
abstract class ExtensibleFallbackHandlerBaseContract<
  ExtensibleFallbackHandlerContractAbiType extends Abi
> extends BaseContract<ExtensibleFallbackHandlerContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of ExtensibleFallbackHandlerBaseContract.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the ExtensibleFallbackHandler contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: ExtensibleFallbackHandlerContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ExtensibleFallbackHandlerContractAbiType,
    deploymentType?: DeploymentType
  ) {
    const contractName = 'extensibleFallbackHandler'

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

export default ExtensibleFallbackHandlerBaseContract
