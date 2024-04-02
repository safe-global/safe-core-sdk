import SimulateTxAccessorBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import SimulateTxAccessorContract_v1_4_1_Contract, {
  SimulateTxAccessorContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1'
import SimulateTxAccessor_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SimulateTxAccessor/v1.4.1/simulate_tx_accessor'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  ContractFunction,
  EncodeFunction
} from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * SimulateTxAccessorContract_v1_4_1_Ethers is the implementation specific to the SimulateTxAccessor contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_4_1_Abi> - Inherits from SimulateTxAccessorBaseContractEthers with ABI specific to SimulateTxAccessor contract version 1.4.1.
 * @implements SimulateTxAccessorContract_v1_4_1_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.4.1.
 */
class SimulateTxAccessorContract_v1_4_1_Ethers
  extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_4_1_Abi>
  implements SimulateTxAccessorContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SimulateTxAccessorContract_v1_4_1_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = SimulateTxAccessor_1_4_1_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  encode: EncodeFunction<SimulateTxAccessorContract_v1_4_1_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: ContractFunction<SimulateTxAccessorContract_v1_4_1_Abi, 'simulate'> = (args) => {
    return this.contract.simulate(...args)
  }
}

export default SimulateTxAccessorContract_v1_4_1_Ethers
