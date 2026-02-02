import MultiSendCallOnlyBaseContract from '@safe-global/protocol-kit/contracts/MultiSend/MultiSendCallOnlyBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import { DeploymentType } from '@safe-global/protocol-kit/types'
import {
  multiSendCallOnly_1_5_0_ContractArtifacts,
  MultiSendCallOnlyContract_v1_5_0_Abi,
  MultiSendCallOnlyContract_v1_5_0_Contract
} from '@safe-global/types-kit'

/**
 * MultiSendCallOnlyContract_v1_5_0  is the implementation specific to the MultiSend contract version 1.5.0.
 *
 * This class specializes in handling interactions with the MultiSendCallOnly contract version 1.5.0 using Ethers.js v6.
 *
 * @extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_5_0_Abi> - Inherits from MultiSendBaseContract with ABI specific to MultiSendCallOnly contract version 1.5.0.
 * @implements MultiSendCallOnlyContract_v1_5_0_Contract - Implements the interface specific to MultiSendCallOnly contract version 1.5.0.
 */
class MultiSendCallOnlyContract_v1_5_0
  extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_5_0_Abi>
  implements MultiSendCallOnlyContract_v1_5_0_Contract
{
  /**
   * Constructs an instance of MultiSendCallOnlyContract_v1_5_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.5.0 is used.
   * @param deploymentType - Optional deployment type for the contract. If not provided, the first deployment retrieved from the safe-deployments array will be used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContract_v1_5_0_Abi,
    deploymentType?: DeploymentType
  ) {
    const safeVersion = '1.5.0'
    const defaultAbi = multiSendCallOnly_1_5_0_ContractArtifacts.abi

    super(
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      deploymentType
    )
  }
}

export default MultiSendCallOnlyContract_v1_5_0
