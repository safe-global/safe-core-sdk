import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SafeProxyFactoryBaseContract serves as a base for creating a Safe Proxy Factory contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as SafeProxyFactoryBaseContractEthers, SafeProxyFactoryBaseContractWeb3, and SafeProxyFactoryBaseContractViem.
 *
 * @template SafeProxyFactoryContractAbiType - The ABI associated with the Safe Proxy Factory contract.
 *
 * Example subclasses extending this base class:
 * - SafeProxyFactoryBaseContractEthers<SafeProxyFactoryContract_v1_3_0_Abi> extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactoryBaseContractWeb3<SafeProxyFactoryContract_v1_3_0_Abi> extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>
 * - SafeProxyFactoryBaseContractViem<SafeProxyFactoryContract_v1_3_0_Abi> extends SafeProxyFactoryBaseContract<SafeProxyFactoryContract_v1_3_0_Abi>
 */
abstract class SafeProxyFactoryBaseContract<SafeProxyFactoryContractAbiType> {
  contractAbi: SafeProxyFactoryContractAbiType
  contractAddress: string

  readonly contractName: contractName = 'safeProxyFactoryVersion'
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.
  abstract adapter: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new SafeProxyFactoryBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the Safe Proxy Factory contract.
   * @param safeVersion - The version of the Safe contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: SafeProxyFactoryContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SafeProxyFactoryContractAbiType
  ) {
    const contractDeployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || contractDeployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid SafeProxyFactory contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (contractDeployment?.abi as SafeProxyFactoryContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default SafeProxyFactoryBaseContract
