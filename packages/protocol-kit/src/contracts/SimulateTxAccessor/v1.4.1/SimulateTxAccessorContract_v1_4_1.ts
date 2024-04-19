import SimulateTxAccessorBaseContract from '@safe-global/protocol-kit/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  SafeVersion,
  simulateTxAccessor_1_4_1_ContractArtifacts,
  SimulateTxAccessorContract_v1_4_1_Abi,
  SimulateTxAccessorContract_v1_4_1_Contract,
  SimulateTxAccessorContract_v1_4_1_Function
} from '@safe-global/safe-core-sdk-types'
/**
 * SimulateTxAccessorContract_v1_4_1  is the implementation specific to the SimulateTxAccessor contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.4.1 using Ethers.js v6.
 *
 * @extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_4_1_Abi> - Inherits from SimulateTxAccessorBaseContract with ABI specific to SimulateTxAccessor contract version 1.4.1.
 * @implements SimulateTxAccessorContract_v1_4_1_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.4.1.
 */
class SimulateTxAccessorContract_v1_4_1
  extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_4_1_Abi>
  implements SimulateTxAccessorContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SimulateTxAccessorContract_v1_4_1
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi = simulateTxAccessor_1_4_1_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: SimulateTxAccessorContract_v1_4_1_Function<'simulate'> = (args) => {
    return this.contract.simulate(...args)
  }
}

export default SimulateTxAccessorContract_v1_4_1
