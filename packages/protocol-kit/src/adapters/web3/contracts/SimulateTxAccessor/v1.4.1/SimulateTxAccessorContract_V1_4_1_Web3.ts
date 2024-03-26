import SimulateTxAccessorBaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/SimulateTxAccessor/SimulateTxAccessorBaseContractWeb3'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import SimulateTxAccessorContract_v1_4_1_Contract, {
  SimulateTxAccessorContract_v1_4_1_Abi
} from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1'
import SimulateTxAccessor_1_4_1_ContractArtifacts from '@safe-global/protocol-kit/contracts/AbiType/assets/SimulateTxAccessor/v1.4.1/simulate_tx_accessor'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import {
  EncodeSimulateTxAccessorFunction,
  GetAddressSimulateTxAccessorFunction
} from '@safe-global/protocol-kit/contracts/AbiType/SimulateTxAccessor/SimulateTxAccessorBaseContract'
import { DeepWriteable } from '@safe-global/protocol-kit/adapters/web3/types'

/**
 * SimulateTxAccessorContract_V1_4_1_Web3 is the implementation specific to the SimulateTxAccessor contract version 1.4.1.
 *
 * This class specializes in handling interactions with the SimulateTxAccessor contract version 1.4.1 using Web3.js.
 *
 * @extends SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_4_1_Abi> - Inherits from SimulateTxAccessorBaseContractWeb3 with ABI specific to SimulateTxAccessor contract version 1.4.1.
 * @implements SimulateTxAccessorContract_v1_4_1_Contract - Implements the interface specific to SimulateTxAccessor contract version 1.4.1.
 */
class SimulateTxAccessorContract_V1_4_1_Web3
  extends SimulateTxAccessorBaseContractWeb3<DeepWriteable<SimulateTxAccessorContract_v1_4_1_Abi>>
  implements SimulateTxAccessorContract_v1_4_1_Contract
{
  safeVersion: SafeVersion

  /**
   * Constructs an instance of SimulateTxAccessorContract_V1_4_1_Web3
   *
   * @param chainId - The chain ID where the contract resides.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the SimulateTxAccessor deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the default ABI for version 1.4.1 is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContract_v1_4_1_Abi
  ) {
    const safeVersion = '1.4.1'
    const defaultAbi =
      SimulateTxAccessor_1_4_1_ContractArtifacts.abi as DeepWriteable<SimulateTxAccessorContract_v1_4_1_Abi>

    super(
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi as DeepWriteable<SimulateTxAccessorContract_v1_4_1_Abi>
    )

    this.safeVersion = safeVersion
  }

  getAddress: GetAddressSimulateTxAccessorFunction = () => {
    return Promise.resolve(this.contract.options.address)
  }

  encode: EncodeSimulateTxAccessorFunction<SimulateTxAccessorContract_v1_4_1_Abi> = (
    functionToEncode,
    args
  ) => {
    return this.contract.methods[functionToEncode](...args).encodeABI()
  }

  simulate: SimulateTxAccessorContract_v1_4_1_Contract['simulate'] = (
    args: readonly [to: string, value: bigint, data: string, operation: number]
  ) => {
    return this.contract.methods.simulate(...args).call()
  }

  // TODO: Remove this mapper after remove Typechain
  mapToTypechainContract(): any {
    return {
      contract: this.contract,

      getAddress: this.getAddress.bind(this),

      encode: this.encode.bind(this)
    }
  }
}

export default SimulateTxAccessorContract_V1_4_1_Web3
