import { Abi } from 'abitype'
import { InterfaceAbi } from 'ethers'

import EthersAdapter from '@safe-global/protocol-kit/adapters/ethers/EthersAdapter'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class MultiSendBaseContractEthers extends BaseContractEthers to specifically integrate with the MultiSend contract.
 * It is designed to be instantiated for different versions of the MultiSend contract.
 *
 * Subclasses of MultiSendBaseContractEthers are expected to represent specific versions of the MultiSend contract.
 *
 * @template MultiSendContractAbiType - The ABI type specific to the version of the MultiSend contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<MultiSendContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - MultiSendContract_v1_4_1_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_4_1_Abi>
 * - MultiSendContract_v1_3_0_Ethers extends MultiSendBaseContractEthers<MultiSendContract_v1_3_0_Abi>
 */
abstract class MultiSendBaseContractEthers<
  MultiSendContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<MultiSendContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of MultiSendBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param ethersAdapter - An instance of EthersAdapter.
   * @param defaultAbi - The default ABI for the MultiSend contract. It should be compatible with the specific version of the MultiSend contract.
   * @param safeVersion - The version of the MultiSend contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the MultiSend deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the MultiSend deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    ethersAdapter: EthersAdapter,
    defaultAbi: MultiSendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultiSendContractAbiType
  ) {
    const contractName = 'multiSendVersion'

    super(
      contractName,
      chainId,
      ethersAdapter,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi
    )

    this.contractName = contractName
  }
}

export default MultiSendBaseContractEthers
