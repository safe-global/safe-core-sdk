import MultiSendBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import MultiSendContract_v1_1_1_Contract, {
  MultiSendContract_v1_1_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.1.1/MultiSendContract_v1_1_1'
import multisend_1_1_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.1.1/multi_send'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeMultiSendFunction,
  GetAddressMultiSendFunction
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/MultiSendBaseContract'
import { AbstractSigner } from 'ethers'

/**
 * MultiSendContract_v1_1_1_Ethers is the implementation specific to the MultiSend contract version 1.1.1.
 *
 * This class specializes in handling interactions with the MultiSend contract version 1.1.1 using Ethers.js v6.
 *
 * @extends MultiSendBaseContractEthers<MultiSendContract_v1_1_1_Abi> - Inherits from MultiSendBaseContractEthers with ABI specific to MultiSend contract version 1.1.1.
 * @implements MultiSendContract_v1_1_1_Contract - Implements the interface specific to MultiSend contract version 1.1.1.
 */
class MultiSendContract_v1_1_1_Ethers
  extends MultiSendBaseContractEthers<MultiSendContract_v1_1_1_Abi>
  implements MultiSendContract_v1_1_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendContract_v1_1_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.1.1 is used.
   */
  constructor(
    chainId: bigint,
    signer: AbstractSigner,
    customContractAddress?: string,
    customContractAbi?: MultiSendContract_v1_1_1_Abi
  ) {
    const safeVersion = '1.1.1'
    const defaultAbi = multisend_1_1_1_ContractArtifacts.abi

    super(chainId, signer, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressMultiSendFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeMultiSendFunction<MultiSendContract_v1_1_1_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default MultiSendContract_v1_1_1_Ethers
