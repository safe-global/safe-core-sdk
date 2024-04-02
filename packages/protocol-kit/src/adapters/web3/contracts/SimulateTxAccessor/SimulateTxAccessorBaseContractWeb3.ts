import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'
import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { contractName } from '@safe-global/protocol-kit/contracts/config'
import { ContractFunction } from '@safe-global/protocol-kit/contracts/AbiType/common/BaseContract'

/**
 * Abstract class SimulateTxAccessorBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the SimulateTxAccessor contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of SimulateTxAccessorBaseContractWeb3 are expected to represent specific versions of the contract.
 *
 * @template SimulateTxAccessorContractAbiType - The ABI type specific to the version of the SimulateTxAccessor contract, extending InterfaceAbi from Web3.
 * @extends BaseContractWeb3<SimulateTxAccessorContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - SimulateTxAccessorContract_v1_4_1_Web3 extends SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_4_1_Abi>
 * - SimulateTxAccessorContract_v1_3_0_Web3 extends SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_3_0_Abi>
 */
abstract class SimulateTxAccessorBaseContractWeb3<
  SimulateTxAccessorContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<SimulateTxAccessorContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of SimulateTxAccessorBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the SimulateTxAccessor contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: SimulateTxAccessorContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContractAbiType
  ) {
    const contractName = 'simulateTxAccessorVersion'

    super(
      contractName,
      chainId,
      web3Adapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }

  /**
   * @param args - Array[to, value, data, operation]
   * @returns Array[estimate, success, returnData]
   */
  simulate: ContractFunction<SimulateTxAccessorContractAbiType, 'simulate'> = (args) => {
    return this.contract.methods.simulate(...(args as ReadonlyArray<any>)).call()
  }
}

export default SimulateTxAccessorBaseContractWeb3
