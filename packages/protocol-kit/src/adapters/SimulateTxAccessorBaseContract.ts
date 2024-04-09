import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class SimulateTxAccessorBaseContract serves as a base for creating a SimulateTxAccessorBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as SimulateTxAccessorBaseContractEthers, SimulateTxAccessorBaseContractWeb3, and SimulateTxAccessorBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from SimulateTxAccessor deployments.
 *
 * @template SimulateTxAccessorContractAbiType - The ABI associated with the SimulateTxAccessor contract.
 *
 * Example subclasses extending this base class:
 * - SimulateTxAccessorBaseContractEthers<SimulateTxAccessorContract_v1_3_0_Abi> extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
 * - SimulateTxAccessorBaseContractWeb3<SimulateTxAccessorContract_v1_3_0_Abi> extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
 * - SimulateTxAccessorBaseContractViem<SimulateTxAccessorContract_v1_3_0_Abi> extends SimulateTxAccessorBaseContract<SimulateTxAccessorContract_v1_3_0_Abi>
 */
abstract class SimulateTxAccessorBaseContract<SimulateTxAccessorContractAbiType> {
  contractAbi: SimulateTxAccessorContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new SimulateTxAccessorBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the SimulateTxAccessor contract.
   * @param safeVersion - The version of the SimulateTxAccessor contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: SimulateTxAccessorContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: SimulateTxAccessorContractAbiType
  ) {
    this.contractName = 'simulateTxAccessorVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as SimulateTxAccessorContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default SimulateTxAccessorBaseContract
