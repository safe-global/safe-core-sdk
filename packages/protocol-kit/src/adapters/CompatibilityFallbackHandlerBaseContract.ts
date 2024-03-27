import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class CompatibilityFallbackHandlerContract serves as a base for creating a CompatibilityFallbackHandler contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as CompatibilityFallbackHandlerContractEthers, CompatibilityFallbackHandlerContractWeb3, and CompatibilityFallbackHandlerContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from CompatibilityFallbackHandler deployments.
 *
 * @template CompatibilityFallbackHandlerContractAbiType - The ABI associated with the CompatibilityFallbackHandler contract.
 *
 * Example subclasses extending this base class:
 * - CompatibilityFallbackHandlerContractEthers<CompatibilityFallbackHandlerContract_v1_3_0_Abi> extends CompatibilityFallbackHandlerContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
 * - CompatibilityFallbackHandlerContractWeb3<CompatibilityFallbackHandlerContract_v1_3_0_Abi> extends CompatibilityFallbackHandlerContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
 * - CompatibilityFallbackHandlerContractViem<CompatibilityFallbackHandlerContract_v1_3_0_Abi> extends CompatibilityFallbackHandlerContract<CompatibilityFallbackHandlerContract_v1_3_0_Abi>
 */
abstract class CompatibilityFallbackHandlerContract<CompatibilityFallbackHandlerContractAbiType> {
  contractAbi: CompatibilityFallbackHandlerContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.
  abstract adapter: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new CompatibilityFallbackHandlerContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the CompatibilityFallbackHandler contract.
   * @param safeVersion - The version of the CompatibilityFallbackHandler contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: CompatibilityFallbackHandlerContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: CompatibilityFallbackHandlerContractAbiType
  ) {
    this.contractName = 'compatibilityFallbackHandler'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as CompatibilityFallbackHandlerContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default CompatibilityFallbackHandlerContract
