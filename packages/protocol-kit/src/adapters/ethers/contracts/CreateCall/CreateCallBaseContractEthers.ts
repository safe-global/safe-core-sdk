import { AbstractSigner, Contract, ContractRunner, InterfaceAbi } from 'ethers'
import CreateCallBaseContract from '@safe-global/protocol-kit/adapters/CreateCallBaseContract'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class CreateCallBaseContractEthers extends CreateCallBaseContract to specifically integrate with the Ethers.js v6 library.
 * It is designed to be instantiated for different versions of the Safe contract.
 *
 * This abstract class sets up the Ethers v6 Contract object that interacts with a CreateCall contract version.
 *
 * Subclasses of CreateCallBaseContractEthers are expected to represent specific versions of the contract.
 *
 * @template CreateCallContractAbiType - The ABI type specific to the version of the CreateCall contract, extending InterfaceAbi from Ethers.
 * @extends CreateCallBaseContract<CreateCallContractAbiType> - Extends the generic CreateCallBaseContract with Ethers-specific implementation.
 *
 * Example subclasses:
 * - CreateCallContract_v1_4_1_Ethers extends CreateCallBaseContractEthers<CreateCallContract_v1_4_1_Abi>
 * - CreateCallContract_v1_3_0_Ethers extends CreateCallBaseContractEthers<CreateCallContract_v1_3_0_Abi>
 */
abstract class CreateCallBaseContractEthers<
  CreateCallContractAbiType extends InterfaceAbi
> extends CreateCallBaseContract<CreateCallContractAbiType> {
  contract: Contract
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
    signer: AbstractSigner,
    defaultAbi: CreateCallContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CreateCallContractAbiType,
    runner?: ContractRunner | null
  ) {
    super(chainId, defaultAbi, safeVersion, customContractAddress, customContractAbi)

    this.contract = new Contract(this.contractAddress, this.contractAbi, runner || signer)
  }
}

export default CreateCallBaseContractEthers
