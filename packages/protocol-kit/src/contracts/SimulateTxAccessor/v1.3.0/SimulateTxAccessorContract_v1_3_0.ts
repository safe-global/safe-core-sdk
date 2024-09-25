import SimulateTxAccessorBaseContract from '@safe-global/protocol-kit/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContract'
import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import {
  simulateTxAccessor_1_3_0_ContractArtifacts,
  SimulateTxAccessorContract_v1_3_0_Abi,
  SimulateTxAccessorContract_v1_3_0_Contract,
  SimulateTxAccessorContract_v1_3_0_Function
} from '@safe-global/types-kit'

import { asHex } from '@safe-global/protocol-kit/utils/types'

/**
 * SimulateTxAccessorContract_v1_3_0  is the implementation specific to the SimulateTxAccessor contract version 1.3.0.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.3.0 using Ethers.js v6.
 *
 * @extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi> - Inherits from SimulateTxAccessorBaseContract with ABI specific to SimulateTxAccessor contract version 1.3.0.
 * @implements SimulateTxAccessorContract_v1_3_0_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.3.0.
 */
class SimulateTxAccessorContract_v1_3_0
  extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
  implements SimulateTxAccessorContract_v1_3_0_Contract
{
  /**
   * Constructs an instance of SimulateTxAccessorContract_v1_3_0
   *
   * @param chainId - The chain ID where the contract resides.
   * @param safeProvider - An instance of SafeProvider.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContract_v1_3_0_Abi
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi = simulateTxAccessor_1_3_0_ContractArtifacts.abi

    super(chainId, safeProvider, defaultAbi, safeVersion, customContractAddress, customContractAbi)
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: SimulateTxAccessorContract_v1_3_0_Function<'simulate'> = async (args) => {
    const [estimate, success, returnData] = await this.write('simulate', args)
    return [BigInt(estimate), !!success, asHex(returnData)]
  }
}

export default SimulateTxAccessorContract_v1_3_0
