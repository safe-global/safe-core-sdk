import SimulateTxAccessorBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  SafeVersion,
  ContractFunction,
  EncodeFunction,
  GetAddressFunction,
  simulateTxAccessor_1_3_0_ContractArtifacts,
  SimulateTxAccessorContract_v1_3_0_Abi,
  SimulateTxAccessorContract_v1_3_0_Contract
} from '@safe-global/safe-core-sdk-types'

/**
 * SimulateTxAccessorContract_v1_3_0_Ethers is the implementation specific to the SimulateTxAccessor contract version 1.3.0.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.3.0 using Ethers.js v6.
 *
 * @extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_3_0_Abi> - Inherits from SimulateTxAccessorBaseContractEthers with ABI specific to SimulateTxAccessor contract version 1.3.0.
 * @implements SimulateTxAccessorContract_v1_3_0_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.3.0.
 */
class SimulateTxAccessorContract_v1_3_0_Ethers
  extends SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_3_0_Abi>
  implements SimulateTxAccessorContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SimulateTxAccessorContract_v1_3_0_Ethers
   *
   * @param chainId - The chain ID where the contract resides.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = simulateTxAccessor_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeFunction<SimulateTxAccessorContract_v1_3_0_Abi> = (functionToEncode, args) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: ContractFunction<SimulateTxAccessorContract_v1_3_0_Abi, 'simulate'> = (args) => {
    return this.contract.simulate(...args)
  }
}

export default SimulateTxAccessorContract_v1_3_0_Ethers
