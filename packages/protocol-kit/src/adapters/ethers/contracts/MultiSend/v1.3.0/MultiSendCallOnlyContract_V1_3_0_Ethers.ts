import MultiSendCallOnlyBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendCallOnlyBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import MultiSendCallOnlyContract_v1_3_0_Contract, {
  MultiSendCallOnlyContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0'
import multiSendCallOnly_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.3.0/multi_send_call_only'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeFunction,
  GetAddressFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * MultiSendCallOnlyContract_v1_3_0_Ethers is the implementation specific to the MultiSendCallOnly contract version 1.3.0.
 *
 * This class specializes in handling interactions with the MultiSendCallOnly contract version 1.3.0 using Ethers.js v6.
 *
 * @extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_3_0_Abi> - Inherits from MultiSendCallOnlyBaseContractEthers with ABI specific to MultiSendCallOnly contract version 1.3.0.
 * @implements MultiSendCallOnlyContract_v1_3_0_Contract - Implements the interface specific to MultiSendCallOnly contract version 1.3.0.
 */
class MultiSendCallOnlyContract_v1_3_0_Ethers
  extends MultiSendCallOnlyBaseContractEthers<MultiSendCallOnlyContract_v1_3_0_Abi>
  implements MultiSendCallOnlyContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendCallOnlyContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = multiSendCallOnly_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<MultiSendCallOnlyContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default MultiSendCallOnlyContract_v1_3_0_Ethers
