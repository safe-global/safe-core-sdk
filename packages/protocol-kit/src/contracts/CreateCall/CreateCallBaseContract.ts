import { Abi } from 'abitype'
import { ContractRunner, InterfaceAbi } from 'ethers'

import SafeProvider from '@safe-global/protocol-kit/SafeProvider'
import BaseContract from '@safe-global/protocol-kit/contracts/BaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { contractName } from '@safe-global/protocol-kit/contracts/config'

/**
 * Abstract class CreateCallBaseContract extends BaseContract to specifically integrate with the CreateCall contract.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * Subclasses of CreateCallBaseContract are expected to represent specific versions of the contract.
 *
 * @template CreateCallContractAbiType - The ABI type specific to the version of the CreateCall contract, extending InterfaceAbi from Ethers.
 * @extends BaseContract<CreateCallContractAbiType> - Extends the generic BaseContract.
 *
 * Example subclasses:
 * - CreateCallContract_v1_4_1  extends CreateCallBaseContract<CreateCallContract_v1_4_1_Abi>
 * - CreateCallContract_v1_3_0  extends CreateCallBaseContract<CreateCallContract_v1_3_0_Abi>
 */
abstract class CreateCallBaseContract<
  CreateCallContractAbiType extends InterfaceAbi & Abi
> extends BaseContract<CreateCallContractAbiType> {
  contractName: contractName

  /**
   * @constructor
   * Constructs an instance of CreateCallBaseContract.
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

export default CreateCallBaseContract
