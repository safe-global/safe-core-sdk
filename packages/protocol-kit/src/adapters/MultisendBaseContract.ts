import { contractName, getContractDeployment } from '@safe-global/protocol-kit/contracts/config'
import { SafeVersion } from '@safe-global/safe-core-sdk-types'

/**
 * Abstract class MultisendBaseContract serves as a base for creating a MultisendBaseContract contract for a specific adapter (Ethers.js, Web3.js, or viem.js)
 * This class is designed to be extended by adapter-specific abstract classes, such as MultisendBaseContractEthers, MultisendBaseContractWeb3, and MultisendBaseContractViem.
 * It includes the core logic for selecting the appropriate ABI and the address from Multisend deployments.
 *
 * @template MultisendContractAbiType - The ABI associated with the Multisend contract.
 *
 * Example subclasses extending this base class:
 * - MultisendBaseContractEthers<MultisendContract_v1_3_0_Abi> extends MultisendBaseContract<MultisendContract_v1_3_0_Abi>
 * - MultisendBaseContractWeb3<MultisendContract_v1_3_0_Abi> extends MultisendBaseContract<MultisendContract_v1_3_0_Abi>
 * - MultisendBaseContractViem<MultisendContract_v1_3_0_Abi> extends MultisendBaseContract<MultisendContract_v1_3_0_Abi>
 */
abstract class MultisendBaseContract<MultisendContractAbiType> {
  contractAbi: MultisendContractAbiType
  contractAddress: string

  contractName: contractName
  abstract safeVersion: SafeVersion

  abstract contract: unknown // This needs to be implemented for each adapter.
  abstract adapter: unknown // This needs to be implemented for each adapter.

  /**
   * Constructs a new MultisendBaseContract instance.
   *
   * @param chainId - The chain ID of the contract.
   * @param defaultAbi - The hardcoded ABI of the Multisend contract.
   * @param safeVersion - The version of the Multisend contract.
   * @param customContractAddress - Optional custom address for the contract.
   * @param customContractAbi - Optional custom ABI for the contract.
   * @throws Will throw an error if the contract address is invalid.
   */
  constructor(
    chainId: bigint,
    defaultAbi: MultisendContractAbiType,
    safeVersion: SafeVersion,
    customContractAddress?: string,
    customContractAbi?: MultisendContractAbiType,
    onlyCalls: boolean = false
  ) {
    this.contractName = onlyCalls ? 'multiSendCallOnlyVersion' : 'multiSendVersion'

    const deployment = getContractDeployment(safeVersion, chainId, this.contractName)

    const contractAddress = customContractAddress || deployment?.defaultAddress

    if (!contractAddress) {
      throw new Error('Invalid contract address')
    }

    this.contractAddress = contractAddress
    this.contractAbi =
      customContractAbi ||
      (deployment?.abi as MultisendContractAbiType) || // this cast is required because abi is set as any[] in safe-deployments
      defaultAbi // if no customAbi and no abi is present in the safe-deployments we use our hardcoded abi
  }
}

export default MultisendBaseContract
