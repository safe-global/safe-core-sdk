import SimulateTxAccessorBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import {
  SafeVersion,
  SimulateTxAccessorContract_v1_3_0_Abi,
  SimulateTxAccessorContract_v1_3_0_Contract,
  SimulateTxAccessorContract_v1_3_0_Function,
  simulateTxAccessor_1_3_0_ContractArtifacts
} from '@safe-global/safe-core-sdk-types'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'

/**
 * SimulateTxAccessorContract_v1_3_0_Web3 is the implementation specific to the SimulateTxAccessor contract version 1.3.0.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.3.0 using Web3.js.
 *
 * @extends SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_3_0_Abi> - Inherits from SimulateTxAccessorBaseContractWeb3 with ABI specific to SimulateTxAccessor contract version 1.3.0.
 * @implements SimulateTxAccessorContract_v1_3_0_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.3.0.
 */
class SimulateTxAccessorContract_v1_3_0_Web3
  extends SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_3_0_Abi>
  implements SimulateTxAccessorContract_v1_3_0_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SimulateTxAccessorContract_v1_3_0_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.3.0 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: DeepWriteable<SimulateTxAccessorContract_v1_3_0_Abi>
  ) {
    const safeVersion = '1.3.0'
    const defaultAbi =
      simulateTxAccessor_1_3_0_ContractArtifacts.abi as DeepWriteable<SimulateTxAccessorContract_v1_3_0_Abi>

    super(chainId, web3Adapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: SimulateTxAccessorContract_v1_3_0_Function<'simulate'> = (args) => {
    return this.contract.methods.simulate(...args).call()
  }
}

export default SimulateTxAccessorContract_v1_3_0_Web3
