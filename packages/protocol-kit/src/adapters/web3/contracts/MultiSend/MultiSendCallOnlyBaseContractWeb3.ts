import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendCallOnlyBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the MultiSendCallOnly contract.
 * It is designed to be instantiated for different versions of the MultiSendCallOnly contract.
 *
 * Subclasses of MultiSendCallOnlyBaseContractWeb3 are expected to represent specific versions of the MultiSendCallOnly contract.
 *
 * @template MultiSendCallOnlyContractAbiType - The ABI type specific to the version of the MultiSendCallOnly contract, extending InterfaceAbi from Web3.
 * @extends BaseContractWeb3<MultiSendCallOnlyContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - MultiSendCallOnlyContract_v1_4_1_Web3 extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_4_1_Abi>
 * - MultiSendCallOnlyContract_v1_3_0_Web3 extends MultiSendCallOnlyBaseContractWeb3<MultiSendCallOnlyContract_v1_3_0_Abi>
 */
abstract class MultiSendCallOnlyBaseContractWeb3<
  MultiSendCallOnlyContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<MultiSendCallOnlyContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendCallOnlyBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the MultiSendCallOnly contract. It should be compatible with the specific version of the MultiSendCallOnly contract.
   * @param safeVersion - The version of the MultiSendCallOnly contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSendCallOnly deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSendCallOnly deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: MultiSendCallOnlyContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendCallOnlyContractAbiType
  ) {
    const contractName = 'multiSendCallOnlyVersion'

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
}

export default MultiSendCallOnlyBaseContractWeb3
