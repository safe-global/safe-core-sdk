import MultiSendBaseContract from '@safe-global/protocol-kit/contracts/MultiSend/MultiSendBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  SafeVersion,
  multisend_1_3_0_ContractArtifacts,
  MultiSendContract_v1_3_0_Abi,
  MultiSendContract_v1_3_0_Contract
} from '@safe-global/types-kit'

/**
 * MultiSendContract_v1_3_0  is the implementation specific to the MultiSend contract version 1.3.0.
 *
 * This class specializes in handling interactions with the MultiSend contract version 1.3.0 using Ethers.js v6.
 *
 * @extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi> - Inherits from MultiSendBaseContract with ABI specific to MultiSend contract version 1.3.0.
 * @implements MultiSendContract_v1_3_0_Contract - Implements the interface specific to MultiSend contract version 1.3.0.
 */
class MultiSendContract_v1_3_0
  extends MultiSendBaseContract<MultiSendContract_v1_3_0_Abi>
  implements MultiSendContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendContract_v1_3_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: MultiSendContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = multisend_1_3_0_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }
}

export default MultiSendContract_v1_3_0
