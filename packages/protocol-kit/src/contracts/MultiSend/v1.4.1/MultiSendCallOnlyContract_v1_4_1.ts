import MultiSendCallOnlyBaseContract from '@safe-global/protocol-kit/contracts/MultiSend/MultiSendCallOnlyBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  multiSendCallOnly_1_4_1_ContractArtifacts,
  MultiSendCallOnlyContract_v1_4_1_Abi,
  MultiSendCallOnlyContract_v1_4_1_Contract
} from '@safe-global/types-kit'

/**
 * MultiSendCallOnlyContract_v1_4_1  is the implementation specific to the MultiSend contract version 1.4.1.
 *
 * This class specializes in handling interactions with the MultiSendCallOnly contract version 1.4.1 using Ethers.js v6.
 *
 * @extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_4_1_Abi> - Inherits from MultiSendBaseContract with ABI specific to MultiSendCallOnly contract version 1.4.1.
 * @implements MultiSendCallOnlyContract_v1_4_1_Contract - Implements the interface specific to MultiSendCallOnly contract version 1.4.1.
 */
class MultiSendCallOnlyContract_v1_4_1
  extends MultiSendCallOnlyBaseContract<MultiSendCallOnlyContract_v1_4_1_Abi>
  implements MultiSendCallOnlyContract_v1_4_1_Contract
{
  /**
   * Constructs an instance of MultiSendCallOnlyContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = multiSendCallOnly_1_4_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)
  }
}

export default MultiSendCallOnlyContract_v1_4_1
