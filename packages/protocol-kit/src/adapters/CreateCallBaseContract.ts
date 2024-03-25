import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class CreateCallBaseContract serves as a base for creating a CreateCallBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as CreateCallBaseContractEthers, CreateCallBaseContractWeb3, and CreateCallBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from CreateCall deployments.
 *
 * @template CreateCallContractAbiType - The ABI associated with the CreateCall contract.
 *
 * Example subclasses extending this base class:
 * - CreateCallBaseContractEthers<CreateCallContract_v1_3_0_Abi> extends CreateCallBaseContract<CreateCallContract_v1_3_0_Abi>
 * - CreateCallBaseContractWeb3<CreateCallContract_v1_3_0_Abi> extends CreateCallBaseContract<CreateCallContract_v1_3_0_Abi>
 * - CreateCallBaseContractViem<CreateCallContract_v1_3_0_Abi> extends CreateCallBaseContract<CreateCallContract_v1_3_0_Abi>
 */
abstract class CreateCallBaseContract<CreateCallContractAbiType> {
  contractAbi: CreateCallContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.
  abstract adapter: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new CreateCallBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the CreateCall contract.
   * @param safeVersion - The version of the CreateCall contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: CreateCallContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CreateCallContractAbiType
  ) {
    this.contractName = 'createCallVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as CreateCallContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default CreateCallBaseContract
