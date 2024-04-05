import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the MultiSend contract.
 * It is designed to be instantiated for different versions of the MultiSend contract.
 *
 * Subclasses of MultiSendBaseContractWeb3 are expected to represent specific versions of the MultiSend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the MultiSend contract, extending InterfaceAbi from Web3.
 * @extends BaseContractWeb3<MultiSendContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1_Web3 extends MultiSendBaseContractWeb3<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0_Web3 extends MultiSendBaseContractWeb3<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContractWeb3<
  MultiSendContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<MultiSendContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the MultiSend contract. It should be compatible with the specific version of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSend deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    const contractName = 'multiSendVersion'

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

export default MultiSendBaseContractWeb3
