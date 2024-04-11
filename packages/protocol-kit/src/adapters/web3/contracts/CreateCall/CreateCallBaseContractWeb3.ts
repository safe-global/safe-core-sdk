import { Abi } from 'abitype'
import { AbiItem } from 'web3-utils'

import Web3Adapter from '@safe-global/protocol-kit/adapters/web3/Web3Adapter'
import BaseContractWeb3 from '@safe-global/protocol-kit/adapters/web3/contracts/BaseContractWeb3'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class CreateCallBaseContractWeb3 extends BaseContractWeb3 to specifically integrate with the CreateCall contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of CreateCallBaseContractWeb3 are expected to represent specific versions of the contract.
 *
 * @template CreateCallContractAbiType - The ABI type specific to the version of the CreateCall contract, extending InterfaceAbi from Web3.
 * @extends BaseContractWeb3<CreateCallContractAbiType> - Extends the generic BaseContractWeb3.
 *
 * Example subclasses:
 * - CreateCallContract_v1_4_1_Web3 extends CreateCallBaseContractWeb3<CreateCallContract_v1_4_1_Abi>
 * - CreateCallContract_v1_3_0_Web3 extends CreateCallBaseContractWeb3<CreateCallContract_v1_3_0_Abi>
 */
abstract class CreateCallBaseContractWeb3<
  CreateCallContractAbiType extends AbiItem[] & Abi
> extends BaseContractWeb3<CreateCallContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of CreateCallBaseContractWeb3.
   *
   * @param chainId - The chain ID of the contract.
   * @param web3Adapter - An instance of Web3Adapter.
   * @param defaultAbi - The default ABI for the CreateCall contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    web3Adapter: Web3Adapter,
    defaultAbi: CreateCallContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CreateCallContractAbiType
  ) {
    const contractName = 'createCallVersion'

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

export default CreateCallBaseContractWeb3
