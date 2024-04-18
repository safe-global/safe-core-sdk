import { Abi } from 'abitype'
import { ContractRunner, InterfaceAbi } from 'ethers'

import SafeProvider from '@safe-global/protocol-kit/adapters/ethers/SafeProvider'
import BaseContractEthers from '@safe-global/protocol-kit/adapters/ethers/contracts/BaseContractEthers'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class CreateCallBaseContractEthers extends BaseContractEthers to specifically integrate with the CreateCall contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of CreateCallBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template CreateCallContractAbiType - The ABI type specific to the version of the CreateCall contract, extending InterfaceAbi from Ethers.
 * @extends BaseContractEthers<CreateCallContractAbiType> - Extends the generic BaseContractEthers.
 *
 * Example subclasses:
 * - CreateCallContract_v1_4_1_Ethers extends CreateCallBaseContractEthers<CreateCallContract_v1_4_1_Abi>
 * - CreateCallContract_v1_3_0_Ethers extends CreateCallBaseContractEthers<CreateCallContract_v1_3_0_Abi>
 */
abstract class CreateCallBaseContractEthers<
  CreateCallContractAbiType extends InterfaceAbi & Abi
> extends BaseContractEthers<CreateCallContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of CreateCallBaseContractEthers.
   *
   * @param chainId - The chain ID of the contract.
   * @param safeProvider - An instance of SafeProvider.
   * @param defaultAbi - The default ABI for the CreateCall contract. It should be compatible with the specific version of the contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract. If not provided, the address is derived from the Safe deployments based on the chainId and safeVersion.
   * @param customContractAbi - Optional custom ABI for the contract. If not provided, the ABI is derived from the Safe deployments or the defaultAbi is used.
   */
  constructor(
    chainId: bigint,
    safeProvider: SafeProvider,
    defaultAbi: CreateCallContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CreateCallContractAbiType,
    runner?: ContractRunner | null
  ) {
    const contractName = 'createCallVersion'

    super(
      contractName,
      chainId,
      safeProvider,
      defaultAbi,
      safeVersion,
      customContractAddress,
      customContractAbi,
      runner
    )

    this.contractName = contractName
  }
}

export default CreateCallBaseContractEthers
