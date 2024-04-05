import SimulateTxAccessorBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import {
  SafeVersion,
  ContractFunction,
  EncodeFunction,
  GetAddressFunction,
  simulateTxAccessor_1_4_1_ContractArtifacts,
  SimulateTxAccessorContract_v1_4_1_Abi,
  SimulateTxAccessorContract_v1_4_1_Contract
} from '@safe-global/safe-core-sdk-types'
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
    const defaultAbi = simulateTxAccessor_1_4_1_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressFunction = () => {
    return this.contract.getAddress()
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
