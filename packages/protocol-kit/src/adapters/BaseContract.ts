import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class BaseContract serves as a base for creating a contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as BaseContractEthers, BaseContractWeb3, and BaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from contract deployments.
 *
 * @template ContractAbiType - The ABI associated with the contract.
 *
 * Example subclasses extending this base class:
 * - BaseContractEthers<ContractAbiType> extends BaseContract<ContractAbiType>
 * - BaseContractWeb3<ContractAbiType> extends BaseContract<ContractAbiType>
 * - BaseContractViem<ContractAbiType> extends BaseContract<ContractAbiType>
 */
abstract class BaseContract<ContractAbiType> {
  contractAbi: ContractAbiType
  contractAddress: string

  abstract contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.
  abstract adapter: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new BaseContract instance.
   *
   * @param contractName - The contract name.
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the contract.
   * @param safeVersion - The version of the contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    contractName: contractName,
    chainId: bigint,
    defaultAbi: ContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: ContractAbiType
  ) {
    const deployment = getContractDeployment(safeVersion, chainId, contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as ContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default BaseContract
