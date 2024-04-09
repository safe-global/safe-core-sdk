import {
  contractName,
  safeDeploymentsL1ChainIds,
  getContractDeployment
} from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SafeBaseContract serves as a base for creating a Safe contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as SafeBaseContractEthers, SafeBaseContractWeb3, and SafeBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from Safe deployments and determining the correct L1 or L2 contract version of the Safe.
 *
 * @template SafeContractAbiType - The ABI associated with the Safe contract.
 *
 * Example subclasses extending this base class:
 * - SafeBaseContractEthers<SafeContract_v1_3_0_Abi> extends SafeBaseContract<SafeContract_v1_3_0_Abi>
 * - SafeBaseContractWeb3<SafeContract_v1_3_0_Abi> extends SafeBaseContract<SafeContract_v1_3_0_Abi>
 * - SafeBaseContractViem<SafeContract_v1_3_0_Abi> extends SafeBaseContract<SafeContract_v1_3_0_Abi>
 */
abstract class SafeBaseContract<SafeContractAbiType> {
  contractAbi: SafeContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new SafeBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the Safe contract.
   * @param safeVersion - The version of the Safe contract.
   * @param isL1SafeSingleton - Flag to indicate if it's an L1 Safe Singleton.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: SafeContractAbiType,
    safeVersion: SafeVersion,
    isL1SafeSingleton = false,
    customContractAddress?: string,
    customContractAbi?: SafeContractAbiType
  ) {
    const isL1Contract = safeDeploymentsL1ChainIds.includes(chainId) || isL1SafeSingleton

    this.contractName = isL1Contract ? 'safeSingletonVersion' : 'safeSingletonL2Version'

    const singletonDeployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || singletonDeployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid SafeProxy contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (singletonDeployment?.abi as SafeContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default SafeBaseContract
