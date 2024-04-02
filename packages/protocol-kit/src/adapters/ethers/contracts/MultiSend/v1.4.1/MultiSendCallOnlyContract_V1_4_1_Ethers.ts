import MultiSendCallOnlyBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendCallOnlyBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import MultiSendCallOnlyContract_v1_4_1_Contract, {
  MultiSendCallOnlyContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import multiSendCallOnly_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.4.1/multi_send_call_only'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * MultiSendCallOnlyContract_v1_4_1_Ethers is the implementation specific to the MultiSend contract version 1.4.1.
 *
 * This class specializes in handling interactions with the MultiSendCallOnly contract version 1.4.1 using Ethers.js v6.
 *
 * @extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_4_1_Abi> - Inherits from MultiSendBaseContractEthers with ABI specific to MultiSendCallOnly contract version 1.4.1.
 * @implements MultiSendCallOnlyContract_v1_4_1_Contract - Implements the interface specific to MultiSendCallOnly contract version 1.4.1.
 */
class MultiSendCallOnlyContract_v1_4_1_Ethers
  extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_4_1_Abi>
  implements MultiSendCallOnlyContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendCallOnlyContract_v1_4_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = multiSendCallOnly_1_4_1_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }
}

export default MultiSendCallOnlyContract_v1_4_1_Ethers
