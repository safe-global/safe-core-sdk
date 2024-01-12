import MultiSendBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import MultisendContract_v1_4_1_Contract, {
  MultisendContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/Multisend/v1.4.1/MultisendContract_v1_4_1'
import multisend_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/Multisend/v1.4.1/multi_send'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeMultiSendFunction,
  GetAddressFunction
} from '@safe-global/protocol-kit/contracts/AbiType/Multisend/MultisendBaseContract'

/**
 * MultiSendContract_v1_4_1_Ethers is the implementation specific to the Safe contract version 1.4.1.
 *
 * This class specializes in handling interactions with the Safe contract version 1.4.1 using Ethers.js v6.
 *
 * @extends MultiSendBaseContractEthers<MultiSendContract_v1_4_1_Abi> - Inherits from SafeBaseContractEthers with ABI specific to Safe contract version 1.4.1.
 * @implements MultiSendContract_v1_4_1_Ethers - Implements the interface specific to Safe contract version 1.4.1.
 */
class MultiSendContract_v1_4_1_Ethers
  extends MultiSendBaseContractEthers<MultisendContract_v1_4_1_Abi>
  implements MultisendContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_4_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: MultisendContract_v1_4_1_Abi,
    onlyCalls = false
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = multisend_1_4_1_ContractArtifacts.abi

    super(
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      onlyCalls
    )

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeMultiSendFunction<MultisendContract_v1_4_1_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default MultiSendContract_v1_4_1_Ethers
