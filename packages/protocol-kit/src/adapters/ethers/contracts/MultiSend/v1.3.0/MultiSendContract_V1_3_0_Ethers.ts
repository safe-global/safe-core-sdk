import MultiSendBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendBaseContractEthers'
import MultiSendContract_v1_3_0_Contract, {
  MultiSendContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/v1.3.0/MultiSendContract_v1_3_0'
import multisend_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.3.0/multi_send'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeMultiSendFunction,
  GetAddressMultiSendFunction
} from '@safe-global/protocol-kit/contracts/AbiType/MultiSend/MultiSendBaseContract'
import { AbstractSigner } from 'ethers'

/**
 * MultiSendContract_v1_3_0_Ethers is the implementation specific to the MultiSend contract version 1.3.0.
 *
 * This class specializes in handling interactions with the MultiSend contract version 1.3.0 using Ethers.js v6.
 *
 * @extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi> - Inherits from MultiSendBaseContractEthers with ABI specific to MultiSend contract version 1.3.0.
 * @implements MultiSendContract_v1_3_0_Contract - Implements the interface specific to MultiSend contract version 1.3.0.
 */
class MultiSendContract_v1_3_0_Ethers
  extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi>
  implements MultiSendContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of MultiSendContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    signer: AbstractSigner,
    customContractAddress?: string,
    customContractAbi?: MultiSendContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = multisend_1_3_0_ContractArtifacts.abi

    super(chainId, signer, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressMultiSendFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeMultiSendFunction<MultiSendContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default MultiSendContract_v1_3_0_Ethers
