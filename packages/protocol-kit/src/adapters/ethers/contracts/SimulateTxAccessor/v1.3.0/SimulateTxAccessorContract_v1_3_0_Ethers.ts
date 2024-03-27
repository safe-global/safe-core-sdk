import SimulateTxAccessorBaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractEthers'
import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import SimulateTxAccessorContract_v1_3_0_Contract, {
  SimulateTxAccessorContract_v1_3_0_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0'
import SimulateTxAccessor_1_3_0_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SimulateTxAccessor/v1.3.0/simulate_tx_accessor'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeSimulateTxAccessorFunction,
  GetAddressSimulateTxAccessorFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/SimulateTxAccessorBaseContract'

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
    const defaultAbi = SimulateTxAccessor_1_3_0_ContractArtifacts.abi

    super(chainId, ethersAdapter, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressSimulateTxAccessorFunction = () => {
    return this.contract.getAddress()
  }

  encode: EncodeSimulateTxAccessorFunction<SimulateTxAccessorContract_v1_3_0_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.interface.encodeFunctionData(functionToEncode, args)
  }

  simulate: SimulateTxAccessorContract_v1_3_0_Contract['simulate'] = (
    args: readonly [to: string, value: bigint, data: string, operation: number]
  ) => {
    return this.contract.simulate(...args)
  }
}

export default SimulateTxAccessorContract_v1_3_0_Ethers
