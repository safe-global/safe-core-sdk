import MultiSendCallOnlyBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/MultiSend/MultiSendCallOnlyBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'
import MultiSendCallOnlyContract_v1_4_1_Contract, {
  MultiSendCallOnlyContract_v1_4_1_Abi as MultiSendCallOnlyContract_v1_4_1_Abi_Readonly
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1'
import multiSend_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.4.1/multi_send_call_only'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeMultiSendCallOnlyFunction,
  GetAddressMultiSendCallOnlyFunction
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/MultiSendCallOnlyBaseContract'

// Remove all nested `readonly` modifiers from the ABI type
type MultiSendCallOnlyContract_v1_4_1_Abi =
  DeepWriteable<MultiSendCallOnlyContract_v1_4_1_Abi_Readonly>

/**
 * MultiSendCallOnlyContract_v1_4_1_Web3 is the implementation specific to the MultiSendCallOnly contract version 1.4.1.
 *
 * This class specializes in handling interactions with the MultiSendCallOnly contract version 1.4.1 using Web3.js v6.
 *
 * @extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_4_1_Abi> - Inherits from MultiSendBaseContractWeb3 with ABI specific to MultiSendCallOnly contract version 1.4.1.
 * @implements MultiSendContract_v1_4_1_Contract - Implements the interface specific to MultiSendCallOnly contract version 1.4.1.
 */
class MultiSendCallOnlyContract_v1_4_1_Web3
  extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_4_1_Abi>
  implements MultiSendCallOnlyContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendCallOnlyContract_v1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = multiSend_1_4_1_ContractArtifacts.abi as MultiSendCallOnlyContract_v1_4_1_Abi

    super(chainId, web3Adapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressMultiSendCallOnlyFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }

  encode: EncodeMultiSendCallOnlyFunction<MultiSendCallOnlyContract_v1_4_1_Abi_Readonly> = (
    functionToEncode,
    args
  ) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }
}

export default MultiSendCallOnlyContract_v1_4_1_Web3
