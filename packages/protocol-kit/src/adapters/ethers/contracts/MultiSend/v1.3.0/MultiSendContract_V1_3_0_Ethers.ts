import MultiSendBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/MultiSend/MultiSendBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import MultisendContract_v1_3_0_Contract, {
  MultisendContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/Multisend/v1.3.0/MultiSendContract_v1_3_0'
import multisend_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/MultiSend/v1.3.0/multi_send'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeMultiSendFunction,
  GetAddressMultisendFunction
} from '@safe-global/protocol-kit/contracts/AbiType/Multisend/MultiSendBaseContract'

/**
 * MultiSendContract_v1_3_0_Ethers is the implementation specific to the Safe contract version 1.3.0.
 *
 * This class specializes in handling interactions with the Safe contract version 1.3.0 using Ethers.js v6.
 *
 * @extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi> - Inherits from SafeBaseContractEthers with ABI specific to Safe contract version 1.3.0.
 * @implements SafeContract_v1_3_0_Contract - Implements the interface specific to Safe contract version 1.3.0.
 */
class MultiSendContract_v1_3_0_Ethers
  extends MultiSendBaseContractEthers<MultisendContract_v1_3_0_Abi>
  implements MultisendContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SafeContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param isL1SafeSingleton - A flag indicating if the contract is a L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: MultisendContract_v1_3_0_Abi,
    onlyCalls = false
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = multisend_1_3_0_ContractArtifacts.abi

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

  getAddress: GetAddressMultisendFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeMultiSendFunction<MultisendContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }
}

export default MultiSendContract_v1_3_0_Ethers
